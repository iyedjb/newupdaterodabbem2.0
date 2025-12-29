import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle } from "docx";
import { saveAs } from "file-saver";
import { format } from "date-fns";

export async function generateEmbarqueWord(destination: any, bus: any, passengers: any[]) {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text: "LISTA DE EMBARQUE",
              bold: true,
              size: 32,
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `Destino: `, bold: true }),
            new TextRun(destination.name),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `Ônibus: `, bold: true }),
            new TextRun(bus.name),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `Data de Geração: `, bold: true }),
            new TextRun(format(new Date(), "dd/MM/yyyy HH:mm")),
          ],
          spacing: { after: 400 },
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Poltrona", bold: true })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Nome do Passageiro", bold: true })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Embarque", bold: true })] })] }),
              ],
            }),
            ...passengers
              .sort((a, b) => parseInt(a.seat_number) - parseInt(b.seat_number))
              .map(p => new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph(p.seat_number.toString())] }),
                  new TableCell({ children: [new Paragraph(p.client_name || "")] }),
                  new TableCell({ children: [new Paragraph(p.client?.departure_location || "-")] }),
                ],
              })),
          ],
        }),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Embarque_${destination.name.replace(/\s+/g, '_')}.docx`);
}

export async function generateListaCompletaWord(destination: any, bus: any, passengers: any[]) {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          children: [new TextRun({ text: "LISTA COMPLETA DE PASSAGEIROS", bold: true, size: 32 })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        }),
        new Paragraph({
          children: [new TextRun({ text: `Destino: ${destination.name}`, bold: true })],
        }),
        new Paragraph({
          children: [new TextRun({ text: `Data: ${format(new Date(), "dd/MM/yyyy")}`, bold: true })],
          spacing: { after: 400 },
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Polt.", bold: true })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Nome", bold: true })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "CPF/RG", bold: true })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Telefone", bold: true })] })] }),
              ],
            }),
            ...passengers
              .sort((a, b) => (a.client_name || "").localeCompare(b.client_name || ""))
              .map(p => new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph(p.seat_number.toString())] }),
                  new TableCell({ children: [new Paragraph(p.client_name || "")] }),
                  new TableCell({ children: [new Paragraph(p.client?.cpf || p.client?.rg || "-")] }),
                  new TableCell({ children: [new Paragraph(p.client?.phone || "-")] }),
                ],
              })),
          ],
        }),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Lista_Completa_${destination.name.replace(/\s+/g, '_')}.docx`);
}

export async function generateMotoristaWord(destination: any, bus: any, passengers: any[]) {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          children: [new TextRun({ text: "LISTA DO MOTORISTA", bold: true, size: 32 })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        }),
        new Paragraph({
          children: [new TextRun({ text: `Destino: ${destination.name}`, bold: true })],
          spacing: { after: 400 },
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Polt.", bold: true })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Nome", bold: true })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "CPF/RG", bold: true })] })] }),
              ],
            }),
            ...passengers
              .sort((a, b) => parseInt(a.seat_number) - parseInt(b.seat_number))
              .map(p => new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph(p.seat_number.toString())] }),
                  new TableCell({ children: [new Paragraph(p.client_name || "")] }),
                  new TableCell({ children: [new Paragraph(p.client?.cpf || p.client?.rg || "-")] }),
                ],
              })),
          ],
        }),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Motorista_${destination.name.replace(/\s+/g, '_')}.docx`);
}

export async function generateHotelWord(destination: any, bus: any, passengers: any[]) {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          children: [new TextRun({ text: "LISTA DO HOTEL", bold: true, size: 32 })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        }),
        new Paragraph({
          children: [new TextRun({ text: `Destino: ${destination.name}`, bold: true })],
          spacing: { after: 400 },
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Nome do Passageiro", bold: true })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "CPF/RG", bold: true })] })] }),
              ],
            }),
            ...passengers
              .sort((a, b) => (a.client_name || "").localeCompare(b.client_name || ""))
              .map(p => new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph(p.client_name || "")] }),
                  new TableCell({ children: [new Paragraph(p.client?.cpf || p.client?.rg || "-")] }),
                ],
              })),
          ],
        }),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Hotel_${destination.name.replace(/\s+/g, '_')}.docx`);
}
