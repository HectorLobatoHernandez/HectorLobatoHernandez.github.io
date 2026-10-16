"""Build the GAZA OPS presentation from checked-in browser captures.

Run from anywhere: python3 apps/gaza/scripts/build-visual-dossier.py
Requires reportlab and Pillow. All visual inputs are stored in assets/dossier.
"""
from pathlib import Path
from tempfile import TemporaryDirectory
from PIL import Image
from reportlab.lib.colors import HexColor, Color
from reportlab.lib.pagesizes import A4, landscape
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets" / "dossier"
OUT = ROOT / "GAZA_OPS_Dossier_Visual_2026.pdf"
TMP = TemporaryDirectory(prefix="gaza-dossier-")
prepared = {}
W, H = landscape(A4)
NAVY = HexColor("#0b1c30")
BLUE = HexColor("#123a78")
GREEN = HexColor("#87b83f")
RED = HexColor("#d91f36")
PAPER = HexColor("#f4f7fb")
INK = HexColor("#172033")
MUTED = HexColor("#55687b")
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
pdfmetrics.registerFont(TTFont("GAZA", FONT))
pdfmetrics.registerFont(TTFont("GAZA-Bold", BOLD))


def fitted(c, path, x, y, w, h, crop=False):
    path = Path(path)
    if path.name != "gaza-lockup.png":
        if path not in prepared:
            output = Path(TMP.name) / (path.stem + ".jpg")
            with Image.open(path) as source:
                source = source.convert("RGB")
                source.thumbnail((900, 610), Image.Resampling.LANCZOS)
                source.save(output, "JPEG", quality=56, optimize=True, subsampling=2)
            prepared[path] = output
        path = prepared[path]
    im = Image.open(path)
    iw, ih = im.size
    scale = max(w / iw, h / ih) if crop else min(w / iw, h / ih)
    pw, ph = iw * scale, ih * scale
    c.saveState()
    p = c.beginPath()
    p.rect(x, y, w, h)
    c.clipPath(p, stroke=0, fill=0)
    c.drawImage(str(path), x + (w - pw) / 2, y + (h - ph) / 2,
                width=pw, height=ph, mask="auto")
    c.restoreState()


def label(c, title, x, y, color=GREEN, size=10):
    c.setFillColor(color)
    c.setFont("GAZA-Bold", size)
    c.drawString(x, y, title)


def lines(c, content, x, y, width, size=11, leading=17, color=INK, bold=False):
    font = "GAZA-Bold" if bold else "GAZA"
    c.setFillColor(color)
    c.setFont(font, size)
    for para in content.split("\n"):
        words, current = para.split(), ""
        for word in words:
            candidate = (current + " " + word).strip()
            if current and pdfmetrics.stringWidth(candidate, font, size) > width:
                c.drawString(x, y, current)
                y -= leading
                current = word
            else:
                current = candidate
        if current:
            c.drawString(x, y, current)
            y -= leading
        y -= 4
    return y


def logo(c, x=W - 164, y=H - 84, width=128, height=54):
    fitted(c, ASSETS / "gaza-lockup.png", x, y, width, height)


def frame(c, number, title, summary):
    c.setFillColor(PAPER)
    c.rect(0, 0, W, H, stroke=0, fill=1)
    c.setFillColor(NAVY)
    c.rect(0, H - 107, W, 107, stroke=0, fill=1)
    c.setFillColor(GREEN)
    c.rect(0, H - 111, W, 4, stroke=0, fill=1)
    label(c, "GAZA OPS  /  DOSSIER VISUAL", 35, H - 32, GREEN, 10)
    label(c, title, 35, H - 68, PAPER, 24)
    lines(c, summary, 36, H - 93, W - 215, 9.5, 13, HexColor("#c3d6e4"))
    logo(c)
    c.setFillColor(NAVY)
    c.rect(0, 0, W, 38, stroke=0, fill=1)
    label(c, "HÉCTOR LOBATO · DEMOSTRADOR INDEPENDIENTE · GEOMETRÍA Y OPERACIÓN SIM", 35, 15, HexColor("#c3d6e4"), 8)
    label(c, f"{number:02d} / 06", W - 84, 15, GREEN, 9)


def image_panel(c, name, x=35, y=83, w=548, h=374):
    fitted(c, ASSETS / name, x, y, w, h, crop=True)
    c.setStrokeColor(HexColor("#a8bbc9"))
    c.setLineWidth(.7)
    c.rect(x, y, w, h, stroke=1, fill=0)


def side(c, title, paragraphs, tag, url=None):
    x, width = 604, 202
    label(c, tag, x, 435, BLUE, 9)
    y = lines(c, title, x, 410, width, 16, 23, INK, bold=True)
    c.setStrokeColor(GREEN)
    c.setLineWidth(3)
    c.line(x, y + 5, x + 38, y + 5)
    y -= 15
    for para in paragraphs:
        y = lines(c, para, x, y, width, 10, 15, MUTED) - 9
    if url:
        label(c, "ABRIR VISTA EN EL NAVEGADOR", x, 99, BLUE, 8)
        lines(c, url.rsplit("/", 1)[-1], x, 83, width, 8, 11, MUTED)
        c.linkURL(url, (x, 75, W - 35, 113), relative=0)


BASE = "https://hectorlobatohernandez.github.io/apps/gaza/"
c = canvas.Canvas(str(OUT), pagesize=(W, H), pageCompression=1)
c.setTitle("GAZA Operations Intelligence | Dossier visual de marca y entornos 3D")
c.setAuthor("Héctor Lobato Hernández")

# Cover: the plant model is the dominant visual, with the logo legible at full size.
c.setFillColor(NAVY)
c.rect(0, 0, W, H, stroke=0, fill=1)
fitted(c, ASSETS / "plant-facade-brand.png", 0, 205, W, H - 205, crop=True)
c.setFillColor(GREEN)
c.rect(0, 201, W, 4, stroke=0, fill=1)
c.setFillColor(NAVY)
c.rect(0, 0, W, 201, stroke=0, fill=1)
c.setFillColor(Color(1, 1, 1, alpha=.96))
c.roundRect(35, 510, 161, 68, 8, stroke=0, fill=1)
logo(c, 47, 517, 137, 54)
label(c, "GAZA  /  OPERATIONS INTELLIGENCE", 37, 171, GREEN, 11)
label(c, "De la granja al muelle", 35, 119, PAPER, 32)
lines(c, "Identidad aplicada a planta, granja, laboratorio y camiones en una simulación operativa 3D.",
      37, 89, 740, 12, 18, HexColor("#d7e5ed"))
label(c, "HÉCTOR LOBATO HERNÁNDEZ · ZAMORA · 16 OCT 2026", 37, 37, HexColor("#a9c2d3"), 9)
label(c, "01 / 06", W - 85, 37, GREEN, 9)
c.showPage()

frame(c, 2, "Planta y almacén", "Rótulos en fachada, acceso industrial y almacén visible al retirar cubiertas.")
image_panel(c, "plant-facade-brand.png", y=217, h=239)
image_panel(c, "plant-warehouse-day.jpg", y=83, h=124)
side(c, "La marca acompaña al flujo", [
    "El rótulo identifica la fachada del modelo exterior inferido. La escena muestra viales, acceso, naves y alumbrado.",
    "Bajo cubierta se revisan posiciones de palés, ocupación del escenario y movimientos hacia muelles.",
    "No es un plano levantado ni un inventario real de GAZA."
], "CORESES · MODELO 3D", BASE + "mission-control.html?view=site")
c.showPage()

frame(c, 3, "Granja y recogida", "Una representación ganadera que conecta naves, rebaños, ordeño y cisterna con el proceso.")
image_panel(c, "farm-facade-brand.png", y=222, h=234)
image_panel(c, "farm-night.jpg", y=83, h=129)
side(c, "Origen visible", [
    "Naves identificadas, espacios de manejo y movimientos del rebaño se exploran desde el mismo visor.",
    "La cisterna y la recogida forman parte de la secuencia SIM; las explotaciones y cantidades no identifican ganaderías reales.",
    "El recinto histórico inspira el contexto visual; los usos ganaderos propuestos no acreditan una instalación existente."
], "GRANJA · ESCENARIO SIM", BASE + "mission-control.html?view=farm")
c.showPage()

frame(c, 4, "Laboratorio y calidad", "El mismo lenguaje de marca enlaza la recepción de muestras y la revisión humana.")
image_panel(c, "lab-quality-brand.png")
side(c, "Siete áreas propuestas", [
    "La captura muestra estaciones de custodia, fisicoquímica, microbiología, metrología y revisión de calidad.",
    "Muestras, equipos, tiempos y personal son ilustrativos. Ningún resultado real ni decisión de liberación se obtiene del visor.",
    "La identidad GAZA aparece en la interfaz del laboratorio y en la navegación común."
], "LABORATORIO · INTERIOR SIM", BASE + "mission-control.html?view=labs")
c.showPage()

frame(c, 5, "Camiones y expedición", "Detalle de rotulación, cabina, palés y seguimiento de la carga en el escenario.")
image_panel(c, "truck-load-brand.png", y=216, h=240)
image_panel(c, "plant-dock-night.jpg", y=83, h=123)
side(c, "Del muelle a la ruta", [
    "El vehículo ilustrativo lleva el logotipo de referencia, mientras el remolque y la carga hacen visible la tarea de expedición.",
    "La vista de flota permite seleccionar rutas y consultar ficha, paradas, velocidad y mercancía del escenario.",
    "No hay camiones, conductores, matrículas o GPS reales conectados."
], "FLOTA · SIMULACIÓN", BASE + "mission-control.html?view=fleet")
c.showPage()

frame(c, 6, "Recorrido y alcance", "Una puerta de entrada para presentar el prototipo y sus límites de evidencia.")
fitted(c, ASSETS / "gaza-lockup.png", 41, 366, 204, 88)
label(c, "RECORRIDO GUIADO", 40, 331, BLUE, 10)
lines(c, "Granja → laboratorio → planta → almacén → muelle → rutas", 40, 300, 735, 19, 28, INK, True)
label(c, "ABRIR DOSSIER WEB", 40, 244, GREEN, 10)
lines(c, BASE + "dossier-candidatura.html", 40, 221, 760, 12, 18, BLUE)
c.linkURL(BASE + "dossier-candidatura.html", (38, 210, 760, 250), relative=0)
label(c, "ABRIR DEMOSTRACIÓN", 40, 188, GREEN, 10)
lines(c, BASE + "demostracion.html", 40, 165, 760, 12, 18, BLUE)
c.linkURL(BASE + "demostracion.html", (38, 155, 760, 195), relative=0)
c.setStrokeColor(HexColor("#c8d4df"))
c.line(40, 130, W - 40, 130)
lines(c, "Proyecto independiente de Héctor Lobato Hernández. La marca gráfica se usa como referencia visual; el modelo 3D, las operaciones, la flota y los valores son simulados o inferidos. Ninguna imagen acredita aprobación de GAZA ni conexión a sus sistemas internos.",
      40, 112, 755, 9.5, 15, MUTED)
c.showPage()
c.save()
TMP.cleanup()
print(OUT)
