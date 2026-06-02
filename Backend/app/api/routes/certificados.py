# Certificados PDF: GET /certificado/

import io
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from PyPDF2 import PdfReader, PdfWriter
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

from auth import get_current_user

router = APIRouter(tags=["Certificados"])


@router.get("/certificado/", summary="Generar un certificado en PDF")
def generar_certificado(
    nombre: str = Query(..., description="Nombre completo de la persona"),
    calidad: str = Query(..., description="Calidad en la que se otorga el certificado"),
    fecha: str = Query(..., description="Fecha del evento o certificado"),
    folio: str = Query(..., description="Folio del certificado"),
    numero: str = Query(..., description="Numero o codigo del certificado"),
    current_user: dict = Depends(get_current_user),
):
    template_path = "Plantillas/certificado.pdf"
    try:
        template_pdf_reader = PdfReader(template_path)

        if len(template_pdf_reader.pages) < 2:
            raise HTTPException(status_code=400, detail="La plantilla debe tener al menos 2 paginas.")

        output = PdfWriter()

        packet1 = io.BytesIO()
        page1_template = template_pdf_reader.pages[0]
        page1_width = float(page1_template.mediabox.width)
        page1_height = float(page1_template.mediabox.height)

        can1 = canvas.Canvas(packet1, pagesize=(page1_width, page1_height))
        can1.setFont("Helvetica-Bold", 22)
        can1.setFillColor(colors.darkblue)
        can1.drawString(250, 340, nombre)
        can1.setFont("Helvetica-Bold", 16)
        can1.setFillColor(colors.black)
        can1.drawString(130, 300, f"En calidad de {calidad}:")
        can1.setFont("Helvetica-Bold", 12)

        fecha_obj = datetime.strptime(fecha, "%d-%m-%Y")
        meses = {
            1: "enero", 2: "febrero", 3: "marzo", 4: "abril",
            5: "mayo", 6: "junio", 7: "julio", 8: "agosto",
            9: "septiembre", 10: "octubre", 11: "noviembre", 12: "diciembre",
        }
        can1.drawString(600, 105, f"Cusco, {fecha_obj.day} de {meses[fecha_obj.month]} {fecha_obj.year}")
        can1.save()
        packet1.seek(0)

        overlay_pdf1 = PdfReader(packet1)
        page1_template.merge_page(overlay_pdf1.pages[0])
        output.add_page(page1_template)

        packet2 = io.BytesIO()
        page2_template = template_pdf_reader.pages[1]
        page2_width = float(page2_template.mediabox.width)
        page2_height = float(page2_template.mediabox.height)

        can2 = canvas.Canvas(packet2, pagesize=(page2_width, page2_height))
        can2.setFont("Courier-Oblique", 10)
        can2.setFillColor(colors.black)
        can2.drawString(290, 465, folio)
        can2.drawString(105, 465, numero)
        can2.drawString(120, 410, fecha)
        can2.save()
        packet2.seek(0)

        overlay_pdf2 = PdfReader(packet2)
        page2_template.merge_page(overlay_pdf2.pages[0])
        output.add_page(page2_template)

        for i in range(2, len(template_pdf_reader.pages)):
            output.add_page(template_pdf_reader.pages[i])

        output_stream = io.BytesIO()
        output.write(output_stream)
        output_stream.seek(0)

        return StreamingResponse(
            output_stream,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=certificado_{calidad}_{numero}.pdf"},
        )

    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"No se encontro la plantilla en '{template_path}'")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al generar el PDF: {e}")
