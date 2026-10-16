"""Build the English download and ATS text mirror from cv/ats-en.html.

The HTML page is the editable source. The PDF uses a restrained A4 layout and
the same semantic content, rather than relying on a headless browser or CDN.
"""
from pathlib import Path
from xml.sax.saxutils import escape as xml_escape

from lxml import html
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate, Frame, KeepTogether, PageTemplate,
    Paragraph, Spacer,
)

ROOT = Path(__file__).resolve().parents[1]
TREE = html.fromstring((ROOT / 'ats-en.html').read_text(encoding='utf-8'))
MAIN = TREE.xpath('//main')[0]
FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
BOLD = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
pdfmetrics.registerFont(TTFont('DejaVu', FONT))
pdfmetrics.registerFont(TTFont('DejaVu-Bold', BOLD))
pdfmetrics.registerFontFamily('DejaVu', normal='DejaVu', bold='DejaVu-Bold')

INK = colors.HexColor('#101311')
MUTED = colors.HexColor('#535e58')


def style(name, size, leading=None, space_before=0, space_after=0, **kwargs):
    font_name = kwargs.pop('fontName', 'DejaVu')
    text_color = kwargs.pop('textColor', INK)
    return ParagraphStyle(
        name, fontName=font_name, fontSize=size, leading=leading or size * 1.34,
        textColor=text_color, alignment=TA_LEFT, spaceBefore=space_before,
        spaceAfter=space_after, allowWidows=0, allowOrphans=0, **kwargs,
    )


ST = {
    'name': style('name', 20, 23, space_after=3, fontName='DejaVu-Bold'),
    'subtitle': style('subtitle', 9, 12, space_after=3, fontName='DejaVu-Bold'),
    'meta': style('meta', 7.5, 10, space_after=3, textColor=MUTED),
    'contact': style('contact', 7.2, 10, space_after=8),
    'heading': style('heading', 10.3, 14, space_before=12, space_after=5, fontName='DejaVu-Bold', keepWithNext=1, borderWidth=0.4, borderColor=colors.HexColor('#a9b1aa'), borderPadding=3),
    'role': style('role', 9, 12, space_before=7, space_after=2, fontName='DejaVu-Bold', keepWithNext=1),
    'small': style('small', 7.5, 10.5, space_after=3, textColor=MUTED),
    'body': style('body', 8.1, 11.5, space_after=4),
    'bullet': style('bullet', 7.8, 10.8, space_after=2, leftIndent=12, firstLineIndent=-9),
    'project': style('project', 8.4, 11.5, space_before=6, space_after=2, fontName='DejaVu-Bold'),
    'tight': style('tight', 7.8, 10.6, space_after=3),
    'note': style('note', 7.0, 9.4, space_before=9, textColor=MUTED),
}


def markup(node):
    """Keep only the inline tags supported by ReportLab Paragraph."""
    out = xml_escape(node.text or '')
    for child in node:
        if child.tag in ('strong', 'b', 'em', 'i'):
            out += f'<{child.tag}>{markup(child)}</{child.tag}>'
        elif child.tag == 'br':
            out += '<br/>'
        elif child.tag == 'a':
            url = xml_escape(child.get('href', ''), {'"': '&quot;'})
            out += f'<link href="{url}">{markup(child)}</link>'
        else:
            out += markup(child)
        out += xml_escape(child.tail or '')
    return out.strip()


def para(node, key='body'):
    return Paragraph(markup(node), ST[key])


story = []
header = MAIN.xpath('./header')[0]
story.append(para(header.xpath('./h1')[0], 'name'))
story.append(para(header.xpath('./div[@class="subtitle"]')[0], 'subtitle'))
story.append(para(header.xpath('./div[@class="meta"]')[0], 'meta'))
contacts = header.xpath('./div[@class="contact"]/a')
story.append(Paragraph('  ·  '.join(markup(c) for c in contacts), ST['contact']))

for section in MAIN.xpath('./section'):
    story.append(para(section.xpath('./h2')[0], 'heading'))
    for node in section:
        cls = node.get('class', '')
        if node.tag == 'h2' or cls == 'tags':
            continue
        if node.tag == 'p':
            story.append(para(node, 'small' if cls == 'small' else 'body'))
        elif cls in ('skills', 'stack'):
            story.extend(para(p, 'tight') for p in node.xpath('./p'))
        elif cls == 'languages':
            story.append(Paragraph('  ·  '.join(markup(s) for s in node.xpath('./span')), ST['body']))
        elif cls == 'timeline':
            parts = list(node)
            for when, detail in zip(parts[::2], parts[1::2]):
                story.append(Paragraph(f'<b>{markup(when)}</b>  ·  {markup(detail)}', ST['tight']))
        elif cls == 'cert-grid':
            for cert in node:
                story.append(Paragraph(f'<b>{markup(cert[0])}</b>  ·  {markup(cert[1])}', ST['tight']))
        elif cls == 'project-grid':
            for project in node:
                contents = [para(project.xpath('./h3')[0], 'project')]
                contents.extend(para(p, 'tight') for p in project.xpath('./p'))
                story.append(KeepTogether(contents))
        elif node.tag == 'article' and cls == 'item':
            head = node.xpath('./div[@class="item-head"]')[0]
            role = node.xpath('./div[@class="role"]')[0]
            story.append(KeepTogether([
                Paragraph(f'{markup(head[0])}  <font color="#535e58">{markup(head[1])}</font>', ST['role']),
                para(role, 'small'),
            ]))
            story.extend(para(li, 'bullet') for li in node.xpath('./ul/li'))

story.append(para(MAIN.xpath('./p[@class="note"]')[0], 'note'))


class CVDocument(BaseDocTemplate):
    def __init__(self, filename):
        super().__init__(filename, pagesize=A4, leftMargin=38, rightMargin=38,
                         topMargin=37, bottomMargin=40, title='Héctor Lobato — English CV',
                         author='Héctor Lobato', subject='Printable professional CV')
        frame = Frame(self.leftMargin, self.bottomMargin, self.width, self.height,
                      leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
        self.addPageTemplates(PageTemplate(id='CV', frames=frame, onPage=self.footer))

    def footer(self, canvas, doc):
        canvas.saveState()
        canvas.setStrokeColor(colors.HexColor('#c9cec9'))
        canvas.line(38, 32, A4[0] - 38, 32)
        canvas.setFont('DejaVu', 7)
        canvas.setFillColor(MUTED)
        canvas.drawString(38, 20, 'HÉCTOR LOBATO · ENGLISH CV')
        canvas.drawRightString(A4[0] - 38, 20, str(doc.page))
        canvas.restoreState()


CVDocument(str(ROOT / 'Hector_Lobato_CV_EN.pdf')).build(story)

# Plain text mirror for ATS imports. The structured HTML remains the source.
lines = ['HÉCTOR LOBATO', 'Systems Integration · Automation · Acoustics · AV · IT/OT · Applied AI',
         'Zamora, Spain', *(c.text_content() for c in contacts)]
for node in MAIN.iter():
    cls = node.get('class', '')
    if node.tag in ('h2', 'h3', 'li') or node.tag == 'p' or cls in ('date', 'role', 'when', 'detail', 'cert', 'languages'):
        content = ' '.join(node.text_content().split())
        lines.append(('- ' if node.tag == 'li' else '') + content)
(ROOT / 'ats-en.txt').write_text('\n'.join(lines) + '\n', encoding='utf-8')
