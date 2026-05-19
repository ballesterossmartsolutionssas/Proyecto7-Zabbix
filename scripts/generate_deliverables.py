from pathlib import Path
import shutil
import subprocess
from zipfile import ZipFile, ZIP_DEFLATED

from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor
from PIL import Image
from pptx import Presentation
from pptx.dml.color import RGBColor as PptRGB
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.util import Inches as PptInches, Pt as PptPt
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    Image as RLImage,
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "entrega-final"
EVID = OUT / "evidencias"
QA = OUT / "qa"

TEAM = [
    "Juan Camilo Ballesteros Sierra",
    "Luis Felipe Murillo Matallana",
    "Juan Sebastian Delgado",
    "Daniela Castro Quinones",
]

FILES = {
    "dashboard": EVID / "01_zabbix_dashboard.png",
    "hosts": EVID / "02_zabbix_hosts.png",
    "latest": EVID / "03_zabbix_latest_data.png",
    "problems": EVID / "04_zabbix_problems.png",
    "mailhog": EVID / "05_mailhog_alertas.png",
    "failure": EVID / "06_zabbix_falla_web_activa.png",
    "mailhog_failure": EVID / "07_mailhog_falla_web.png",
}


def ensure_dirs():
    OUT.mkdir(exist_ok=True)
    EVID.mkdir(exist_ok=True)
    QA.mkdir(exist_ok=True)


def set_cell_shading(cell, fill):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:fill"), fill)
    tc_pr.append(shd)


def set_cell_text(cell, text, bold=False):
    cell.text = ""
    p = cell.paragraphs[0]
    run = p.add_run(text)
    run.bold = bold
    run.font.size = Pt(8.5)
    cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER


def set_two_columns(section):
    sect_pr = section._sectPr
    cols = sect_pr.xpath("./w:cols")
    if cols:
        cols = cols[0]
    else:
        cols = OxmlElement("w:cols")
        sect_pr.append(cols)
    cols.set(qn("w:num"), "2")
    cols.set(qn("w:space"), "360")


def style_doc(doc):
    for section in doc.sections:
        section.top_margin = Inches(0.7)
        section.bottom_margin = Inches(0.7)
        section.left_margin = Inches(0.62)
        section.right_margin = Inches(0.62)
    normal = doc.styles["Normal"]
    normal.font.name = "Times New Roman"
    normal.font.size = Pt(9)
    normal._element.rPr.rFonts.set(qn("w:eastAsia"), "Times New Roman")
    for name in ["Heading 1", "Heading 2"]:
        style = doc.styles[name]
        style.font.name = "Times New Roman"
        style.font.bold = True
        style.font.color.rgb = RGBColor(0x11, 0x32, 0x3d)
        style.font.size = Pt(10 if name == "Heading 1" else 9)


def add_heading(doc, text):
    p = doc.add_paragraph()
    p.style = doc.styles["Heading 1"]
    p.paragraph_format.space_before = Pt(5)
    p.paragraph_format.space_after = Pt(2)
    p.add_run(text)


def add_body(doc, text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p.paragraph_format.first_line_indent = Inches(0.18)
    p.paragraph_format.space_after = Pt(2)
    p.add_run(text)


def add_figure(doc, path, caption, width=3.05):
    if not path.exists():
        return
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.add_run().add_picture(str(path), width=Inches(width))
    cap = doc.add_paragraph()
    cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = cap.add_run(caption)
    run.italic = True
    run.font.size = Pt(8)


def create_docx():
    doc = Document()
    style_doc(doc)

    title = doc.add_paragraph()
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = title.add_run("Proyecto 7: Monitoreo de infraestructura con Zabbix")
    run.bold = True
    run.font.name = "Times New Roman"
    run.font.size = Pt(16)

    authors = doc.add_paragraph()
    authors.alignment = WD_ALIGN_PARAGRAPH.CENTER
    authors.add_run("\n".join(TEAM)).font.size = Pt(10)

    abstract = doc.add_paragraph()
    abstract.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    r = abstract.add_run("Resumen - ")
    r.bold = True
    abstract.add_run(
        "Este proyecto implementa una plataforma de monitoreo de infraestructura con Zabbix 6.x desplegada completamente en contenedores Docker. "
        "La solucion monitorea servicios web, base de datos, DNS y FTP, registra metricas de disponibilidad y recursos, define triggers de falla y valida el envio de alertas mediante MailHog. "
        "Adicionalmente se publico el entorno en una VPS con HTTPS y se implemento una aplicacion real con frontend, backend Node.js, MariaDB, graficas operativas, SLO, exporter de metricas y pruebas de carga con Artillery."
    )

    keywords = doc.add_paragraph()
    keywords.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    r = keywords.add_run("Palabras clave - ")
    r.bold = True
    keywords.add_run("Zabbix, Docker Compose, monitoreo, alertas, MailHog, Artillery, infraestructura.")

    doc.add_section(WD_SECTION.CONTINUOUS)
    set_two_columns(doc.sections[-1])

    add_heading(doc, "I. Introduccion")
    add_body(
        doc,
        "Las infraestructuras telematicas requieren observabilidad para detectar fallas, analizar disponibilidad y reducir tiempos de indisponibilidad. "
        "Zabbix centraliza metricas, eventos y alertas, por lo que es adecuado para demostrar monitoreo de servicios en un entorno reproducible con Docker. "
        "El alcance se amplio con un portal publico que permite observar carga, telemetria y cumplimiento del enunciado durante la sustentacion.",
    )

    add_heading(doc, "II. Contexto del problema")
    add_body(
        doc,
        "Una red compuesta por servicios HTTP, base de datos, DNS y FTP puede presentar fallas por caida de procesos, saturacion de recursos o perdida de conectividad. "
        "Sin una plataforma de monitoreo, la deteccion depende de revision manual. El proyecto busca evidenciar estado en tiempo real, historial, alertas automaticas y respuesta del sistema bajo carga controlada.",
    )

    add_heading(doc, "III. Alternativas de solucion")
    add_body(
        doc,
        "Se evaluaron alternativas como Nagios, Prometheus, Datadog y Zabbix. Zabbix fue seleccionado porque integra servidor, agentes, frontend web, triggers, dashboards y notificaciones sin depender de una plataforma externa paga.",
    )

    add_heading(doc, "IV. Diseno de la solucion")
    add_body(
        doc,
        "La arquitectura incluye Zabbix Server, PostgreSQL, Zabbix Web, MailHog y cuatro servicios monitoreados. Todos los componentes se conectan mediante la red Docker proyecto7-monitoring. "
        "Los agentes reportan disponibilidad y Zabbix Server ejecuta checks simples para validar el estado de los puertos de servicio. En la VPS, Caddy publica Zabbix, MailHog y el portal web mediante subdominios HTTPS.",
    )

    table = doc.add_table(rows=1, cols=3)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    hdr = table.rows[0].cells
    for cell, text in zip(hdr, ["Host", "Servicio", "Check"]):
        set_cell_text(cell, text, True)
        set_cell_shading(cell, "D9EAD3")
    rows = [
        ("web-host", "Node.js web", "HTTP puerto 80"),
        ("db-host", "MariaDB", "TCP puerto 3306"),
        ("dns-host", "CoreDNS", "TCP puerto 53"),
        ("ftp-host", "VSFTPD", "FTP puerto 21"),
    ]
    for row in rows:
        cells = table.add_row().cells
        for cell, text in zip(cells, row):
            set_cell_text(cell, text)

    add_figure(doc, FILES["hosts"], "Fig. 1. Hosts monitoreados registrados en Zabbix.")

    add_heading(doc, "V. Implementacion")
    add_body(
        doc,
        "El despliegue se ejecuta con Docker Compose. El archivo .env centraliza credenciales, puertos y zona horaria. "
        "El servidor Zabbix usa una imagen personalizada construida desde docker/zabbix-server/Dockerfile. "
        "Tambien se montan archivos de configuracion Zabbix como volumen para el servidor y los agentes. "
        "El script de aprovisionamiento usa la API JSON-RPC de Zabbix para crear el grupo de hosts, items, triggers, dashboard, escenario web y configuracion de correo hacia MailHog. "
        "El servicio web expone endpoints JSON, /metrics, /api/charts y /api/compliance para demostrar monitoreo avanzado.",
    )
    add_figure(doc, FILES["latest"], "Fig. 2. Datos recientes de disponibilidad y metricas.")

    add_heading(doc, "VI. Pruebas")
    add_body(
        doc,
        "Se validaron cuatro escenarios minimos: dashboard en tiempo real, simulacion de caida del servicio web, envio de alertas a MailHog y consulta de datos historicos. "
        "Tambien se ejecutaron pruebas con Artillery contra frontend, API, base de datos y endpoints de carga; la auditoria automatica reviso Compose, endpoints publicos, matriz de cumplimiento y objetos principales de Zabbix.",
    )
    add_figure(doc, FILES["failure"], "Fig. 3. Problema activo durante la simulacion de caida.")
    add_figure(doc, FILES["mailhog_failure"], "Fig. 4. Correos de alerta y recuperacion recibidos en MailHog.")

    add_heading(doc, "VII. Discusion")
    add_body(
        doc,
        "Los checks de servicio regresan 1 cuando el puerto responde y 0 cuando no responde. Los triggers permiten convertir cambios de estado en eventos visibles y notificaciones. "
        "MailHog facilita probar el flujo de correo sin exponer cuentas reales y el canal SMTP real del dominio demuestra escalamiento externo. "
        "Las pruebas de carga relacionan trafico, latencia, SLO, escrituras en MariaDB y graficas historicas.",
    )

    add_heading(doc, "VIII. Conclusiones")
    add_body(
        doc,
        "La solucion cumple los requerimientos del Proyecto 7: infraestructura en contenedores, minimo cuatro hosts monitoreados, Zabbix Server con base de datos, frontend web, triggers, dashboards y alertas. "
        "El despliegue publico, backend transaccional, Artillery, exporter /metrics y matriz /api/compliance agregan evidencia para defender el proyecto por encima de los requisitos minimos.",
    )

    add_heading(doc, "Referencias")
    refs = [
        "Zabbix Documentation, https://www.zabbix.com/documentation",
        "Docker Documentation, https://docs.docker.com",
        "MailHog, https://github.com/mailhog/MailHog",
        "CoreDNS, https://coredns.io",
        "Artillery Documentation, https://www.artillery.io/docs",
        "Caddy Documentation, https://caddyserver.com/docs",
    ]
    for ref in refs:
        p = doc.add_paragraph(ref)
        p.paragraph_format.left_indent = Inches(0.12)
        p.paragraph_format.space_after = Pt(1)

    out = OUT / "Informe_IEEE_Proyecto7_Zabbix.docx"
    doc.save(out)
    return out


def rl_img(path, width=6.2 * inch):
    img = Image.open(path)
    ratio = img.height / img.width
    return RLImage(str(path), width=width, height=width * ratio)


def create_pdf():
    out = OUT / "Informe_IEEE_Proyecto7_Zabbix.pdf"
    doc = SimpleDocTemplate(
        str(out),
        pagesize=letter,
        rightMargin=0.62 * inch,
        leftMargin=0.62 * inch,
        topMargin=0.7 * inch,
        bottomMargin=0.7 * inch,
    )
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle("TitleCenter", parent=styles["Title"], alignment=TA_CENTER, fontName="Times-Bold", fontSize=16, leading=18))
    styles.add(ParagraphStyle("Author", parent=styles["Normal"], alignment=TA_CENTER, fontName="Times-Roman", fontSize=9, leading=11))
    styles.add(ParagraphStyle("IEEEBody", parent=styles["Normal"], alignment=TA_JUSTIFY, fontName="Times-Roman", fontSize=9, leading=11, firstLineIndent=12))
    styles.add(ParagraphStyle("IEEEHead", parent=styles["Heading2"], fontName="Times-Bold", fontSize=10, leading=12, textColor=colors.HexColor("#11323d")))
    styles.add(ParagraphStyle("Caption", parent=styles["Normal"], alignment=TA_CENTER, fontName="Times-Italic", fontSize=8, leading=9))

    story = [
        Paragraph("Proyecto 7: Monitoreo de infraestructura con Zabbix", styles["TitleCenter"]),
        Paragraph("<br/>".join(TEAM), styles["Author"]),
        Spacer(1, 0.12 * inch),
        Paragraph("<b>Resumen - </b>Este proyecto implementa una plataforma de monitoreo con Zabbix 6.x, Docker Compose, cuatro servicios monitoreados y alertas validadas con MailHog. La solucion se publico en VPS con HTTPS e incorpora backend Node.js, MariaDB, graficas, SLO, exporter de metricas y pruebas Artillery.", styles["IEEEBody"]),
        Paragraph("<b>Palabras clave - </b>Zabbix, Docker, monitoreo, alertas, MailHog, Artillery.", styles["IEEEBody"]),
        Spacer(1, 0.12 * inch),
    ]
    sections = [
        ("I. Introduccion", "Las infraestructuras telematicas requieren observabilidad para detectar fallas y reducir tiempos de indisponibilidad. Zabbix centraliza metricas, eventos y alertas en un entorno reproducible."),
        ("II. Contexto", "La red evaluada contiene servicios HTTP, base de datos, DNS y FTP. La deteccion manual de fallas no escala; por ello se implementa monitoreo con eventos, notificaciones y pruebas de carga."),
        ("III. Diseno", "La arquitectura usa Zabbix Server, PostgreSQL, Zabbix Web, MailHog, agentes Zabbix y un portal publico con backend Node.js. Todos los servicios se conectan mediante Docker Compose y la VPS publica subdominios HTTPS."),
    ]
    for title, body in sections:
        story += [Paragraph(title, styles["IEEEHead"]), Paragraph(body, styles["IEEEBody"])]

    data = [["Host", "Servicio", "Check"], ["web-host", "Node.js web", "HTTP 80"], ["db-host", "MariaDB", "TCP 3306"], ["dns-host", "CoreDNS", "TCP 53"], ["ftp-host", "VSFTPD", "FTP 21"]]
    tbl = Table(data, colWidths=[1.4 * inch, 1.4 * inch, 2.0 * inch])
    tbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#D9EAD3")),
        ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#9CA3AF")),
        ("FONTNAME", (0, 0), (-1, 0), "Times-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    story += [Spacer(1, 0.08 * inch), tbl, Spacer(1, 0.12 * inch)]
    for key, caption in [
        ("hosts", "Fig. 1. Hosts monitoreados en Zabbix."),
        ("latest", "Fig. 2. Latest data con checks de disponibilidad."),
        ("failure", "Fig. 3. Problema activo durante la caida del servicio web."),
        ("mailhog_failure", "Fig. 4. Alertas recibidas en MailHog."),
    ]:
        if FILES[key].exists():
            story += [KeepTogether([rl_img(FILES[key], 6.0 * inch), Paragraph(caption, styles["Caption"])])]

    story += [
        Paragraph("IV. Pruebas y resultados", styles["IEEEHead"]),
        Paragraph("La prueba de caida detuvo web-service, generando evento en Zabbix y correos de problema/recuperacion. Los checks de HTTP, MySQL, DNS y FTP retornaron valor 1 en estado normal. Artillery genero trafico contra frontend, API, MariaDB y endpoints de carga controlada.", styles["IEEEBody"]),
        Paragraph("V. Conclusiones", styles["IEEEHead"]),
        Paragraph("La solucion cumple los requerimientos: despliegue dockerizado, minimo cuatro hosts monitoreados, dashboards, triggers, alertas y evidencia historica. El portal publico, SLO, exporter /metrics y matriz /api/compliance agregan valor para la sustentacion.", styles["IEEEBody"]),
        Paragraph("Referencias", styles["IEEEHead"]),
        Paragraph("[1] Zabbix Documentation. [2] Docker Documentation. [3] MailHog GitHub. [4] Artillery Documentation. [5] Caddy Documentation.", styles["IEEEBody"]),
    ]
    doc.build(story)
    return out


def add_text(slide, text, x, y, w, h, size=24, bold=False, color=(22, 41, 52), align=PP_ALIGN.LEFT):
    box = slide.shapes.add_textbox(PptInches(x), PptInches(y), PptInches(w), PptInches(h))
    tf = box.text_frame
    tf.clear()
    tf.vertical_anchor = MSO_ANCHOR.TOP
    p = tf.paragraphs[0]
    p.alignment = align
    r = p.add_run()
    r.text = text
    r.font.size = PptPt(size)
    r.font.bold = bold
    r.font.color.rgb = PptRGB(*color)
    return box


def add_bullets(slide, bullets, x, y, w, h, size=20):
    box = slide.shapes.add_textbox(PptInches(x), PptInches(y), PptInches(w), PptInches(h))
    tf = box.text_frame
    tf.clear()
    for idx, bullet in enumerate(bullets):
        p = tf.paragraphs[0] if idx == 0 else tf.add_paragraph()
        p.text = bullet
        p.level = 0
        p.font.size = PptPt(size)
        p.font.color.rgb = PptRGB(35, 45, 55)
        p.space_after = PptPt(8)
    return box


def add_screenshot(slide, path, x, y, w, h=None):
    if not path.exists():
        return None
    with Image.open(path) as img:
        ratio = img.height / img.width
    if h is None:
        h = w * ratio
    return slide.shapes.add_picture(str(path), PptInches(x), PptInches(y), width=PptInches(w), height=PptInches(h))


def add_footer(slide, num):
    add_text(slide, f"Proyecto 7 - Zabbix | {num}", 0.45, 7.12, 4.0, 0.25, size=8, color=(93, 107, 122))


def create_pptx():
    prs = Presentation()
    prs.slide_width = PptInches(13.333)
    prs.slide_height = PptInches(7.5)
    blank = prs.slide_layouts[6]

    def bg(slide, color=(248, 250, 252)):
        slide.background.fill.solid()
        slide.background.fill.fore_color.rgb = PptRGB(*color)

    # 1
    s = prs.slides.add_slide(blank)
    bg(s, (12, 36, 47))
    add_text(s, "Proyecto 7", 0.75, 0.7, 4.5, 0.6, 22, True, (127, 255, 212))
    add_text(s, "Monitoreo de infraestructura\ncon Zabbix", 0.75, 1.45, 8.2, 1.55, 36, True, (255, 255, 255))
    add_text(s, "\n".join(TEAM), 0.8, 4.65, 6.8, 1.3, 16, False, (219, 234, 254))
    add_screenshot(s, FILES["dashboard"], 9.15, 0.78, 3.65, 2.55)

    slides = [
        ("Problema", ["Servicios distribuidos pueden fallar sin aviso.", "La revision manual tarda y no deja historial.", "Se necesita visibilidad, alertas y evidencia para sustentacion."], None),
        ("Objetivo", ["Desplegar Zabbix 6.x en Docker Compose.", "Monitorear web, base de datos, DNS y FTP.", "Validar triggers, dashboards, historicos y alertas por correo.", "Agregar portal HTTPS con backend, graficas, SLO y carga Artillery."], None),
        ("Arquitectura Docker", ["Zabbix Server + PostgreSQL + Zabbix Web.", "MailHog simula SMTP para notificaciones.", "Red interna proyecto7-monitoring para resolucion por nombre.", "Caddy publica subdominios HTTPS en la VPS."], "hosts"),
        ("Inventario monitoreado", ["web-host: portal Node.js HTTP.", "db-host: MariaDB puerto 3306.", "dns-host: CoreDNS puerto 53.", "ftp-host: VSFTPD puerto 21."], "hosts"),
        ("Implementacion", ["docker-compose.yml define todos los componentes.", "Zabbix Server usa imagen personalizada con Dockerfile.", "Configuraciones Zabbix se montan como volumen.", "provision_zabbix.py registra hosts, items, triggers y web scenario por API."], None),
        ("Dashboard y datos", ["Latest data muestra disponibilidad y metricas.", "Centro de graficas muestra CPU, memoria, disco, rutas y carga.", "La matriz de cumplimiento /api/compliance cruza requisitos contra evidencia."], "latest"),
        ("Prueba de caida", ["Se detiene web-service durante la demostracion.", "Zabbix marca el trigger HTTP web-service no responde.", "Al restaurar el contenedor, el evento queda resuelto."], "failure"),
        ("Alertas con MailHog", ["MailHog recibe correos de problema y recuperacion.", "El portal mailhog-zabbix tiene login propio.", "Tambien existe canal SMTP real del dominio para escalamiento."], "mailhog_failure"),
        ("Pruebas de carga", ["Artillery genera trafico real contra frontend y API.", "El backend registra telemetria e incidentes en MariaDB.", "Zabbix observa /metrics, DB status y web scenario publico."], None),
        ("Resultados", ["Contenedores principales saludables.", "Cuatro servicios con check de disponibilidad activo.", "Alertas generadas y recuperadas durante la prueba.", "Auditoria automatica con 0 fallas esperadas."], "problems"),
        ("Entregables", ["Informe IEEE: entrega-final/Informe_IEEE_Proyecto7_Zabbix.pdf.", "Diapositivas: entrega-final/Presentacion_Proyecto7_Zabbix.pptx.", "Repo GitHub con README, Compose, scripts y evidencias."], None),
        ("Conclusiones", ["Zabbix centraliza observabilidad operativa.", "Docker Compose hace el despliegue reproducible.", "El portal publico, Artillery y /api/compliance elevan la solucion sobre el minimo."], None),
        ("Demo en vivo", ["Abrir web-zabbix.negociocontigo.com.", "Ejecutar: artillery run tests/artillery-live-demo.yml.", "Simular caida: docker compose -f docker-compose.vps.yml stop web-service.", "Cerrar con: bash scripts/audit-project.sh."], None),
    ]
    img_map = {
        "hosts": FILES["hosts"],
        "latest": FILES["latest"],
        "failure": FILES["failure"],
        "mailhog_failure": FILES["mailhog_failure"],
        "problems": FILES["problems"],
    }
    for idx, (title, bullets, image_key) in enumerate(slides, 2):
        s = prs.slides.add_slide(blank)
        bg(s)
        add_text(s, title, 0.55, 0.42, 7.6, 0.5, 28, True, (17, 50, 61))
        add_bullets(s, bullets, 0.7, 1.35, 5.25 if image_key else 11.5, 4.8, 20)
        if image_key:
            add_screenshot(s, img_map[image_key], 6.35, 1.15, 6.25, 4.45)
        add_footer(s, idx)

    out = OUT / "Presentacion_Proyecto7_Zabbix.pptx"
    prs.save(out)
    return out


def create_pptx_pdf(pptx_path):
    pdf_path = OUT / "Presentacion_Proyecto7_Zabbix.pdf"
    soffice = shutil.which("soffice") or shutil.which("soffice.com")
    if not soffice:
        return pdf_path if pdf_path.exists() else None
    subprocess.run(
        [soffice, "--headless", "--convert-to", "pdf", "--outdir", str(OUT), str(pptx_path)],
        check=False,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    return pdf_path if pdf_path.exists() else None


def create_checklist():
    path = OUT / "CHECKLIST_ENTREGA.md"
    path.write_text(
        """# Checklist de entrega - Proyecto 7

- [x] docker-compose.yml con Zabbix Server, Zabbix Web, base de datos, MailHog y 4 servicios monitoreados.
- [x] Imagen Zabbix personalizada con Dockerfile.
- [x] Archivos de configuracion Zabbix montados como volumen.
- [x] Hosts monitoreados: web, DB, DNS y FTP.
- [x] Triggers de disponibilidad configurados.
- [x] Alertas por correo validadas en MailHog.
- [x] README con instrucciones de despliegue.
- [x] Informe IEEE en DOCX y PDF.
- [x] Presentacion PPTX.
- [x] Evidencias PNG de dashboard, hosts, latest data, falla y MailHog.
- [x] Web publica con backend, MariaDB, graficas, SLO, exporter `/metrics` y pruebas Artillery.
- [x] Matriz de cumplimiento verificable en `/api/compliance`.
- [x] Script de auditoria reproducible `scripts/audit-project.sh`.
- [x] Guia de entregables y evaluacion `docs/ENTREGABLES_EVALUACION.md`.
- [x] Matriz de rubrica `docs/MATRIZ_RUBRICA.md`.

Accesos locales:

- Zabbix: http://localhost:8088
- Usuario: Admin
- Clave: zabbix
- MailHog: http://localhost:8025

Accesos publicos:

- Portal: https://web-zabbix.negociocontigo.com
- Zabbix: https://zabbix.negociocontigo.com
- MailHog: https://mailhog-zabbix.negociocontigo.com/login
""",
        encoding="utf-8",
    )
    return path


def zip_delivery(paths):
    zip_path = OUT / "Proyecto7_Zabbix_entrega_final.zip"
    include = [
        ROOT / ".env.example",
        ROOT / "docker-compose.yml",
        ROOT / "docker-compose.vps.yml",
        ROOT / "README.md",
        ROOT / "docker" / "zabbix-server" / "Dockerfile",
        ROOT / "docker" / "zabbix-server" / "zabbix_server.conf.d" / "proyecto7.conf",
        ROOT / "zabbix-config" / "agent" / "proyecto7-agent.conf",
        ROOT / "docs" / "PRUEBAS.md",
        ROOT / "docs" / "SUSTENTACION.md",
        ROOT / "docs" / "PRESENTACION.md",
        ROOT / "docs" / "DEMO_AVANZADA.md",
        ROOT / "docs" / "ENTREGABLES_EVALUACION.md",
        ROOT / "docs" / "MATRIZ_RUBRICA.md",
        ROOT / "docs" / "GUION_SUSTENTACION_20_MIN.md",
        ROOT / "scripts" / "provision.ps1",
        ROOT / "scripts" / "provision_zabbix.py",
        ROOT / "scripts" / "test-failure.ps1",
        ROOT / "scripts" / "verify.ps1",
        ROOT / "scripts" / "audit-project.sh",
        ROOT / "scripts" / "evidence-pack.sh",
        ROOT / "scripts" / "live-artillery-demo.sh",
        ROOT / "scripts" / "demo-full.sh",
        ROOT / "tests" / "artillery-smoke.yml",
        ROOT / "tests" / "artillery-live-demo.yml",
        ROOT / "tests" / "artillery-web-service.yml",
        ROOT / "tests" / "artillery-stress-demo.yml",
        ROOT / "services" / "web" / "default.conf",
        ROOT / "services" / "web" / "Dockerfile",
        ROOT / "services" / "web" / "server.js",
        ROOT / "services" / "web" / "package.json",
        ROOT / "services" / "web" / "package-lock.json",
        ROOT / "services" / "web" / "html" / "index.html",
        ROOT / "services" / "dns" / "Corefile",
        *paths,
        *sorted(EVID.glob("*.png")),
    ]
    with ZipFile(zip_path, "w", ZIP_DEFLATED) as zf:
        for path in include:
            if path.exists():
                zf.write(path, path.relative_to(ROOT))
    return zip_path


def main():
    ensure_dirs()
    docx = create_docx()
    pdf = create_pdf()
    pptx = create_pptx()
    pptx_pdf = create_pptx_pdf(pptx)
    checklist = create_checklist()
    delivery_paths = [docx, pdf, pptx, checklist]
    if pptx_pdf:
        delivery_paths.append(pptx_pdf)
    zip_path = zip_delivery(delivery_paths)
    for path in [*delivery_paths, zip_path]:
        print(path)


if __name__ == "__main__":
    main()
