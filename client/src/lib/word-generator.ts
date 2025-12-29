import { format } from "date-fns";

// ✅ Lazy loaders (THIS IS THE FIX)
async function loadDocx() {
  return await import("docx");
}

async function loadFileSaver() {
  return await import("file-saver");
}

// ------------------ helpers ------------------

async function createHeader(
  title: string,
  destination: any,
  bus: any,
  docx: any
) {
  const {
    Paragraph,
    TextRun,
    AlignmentType
  } = docx;

  const children: any[] = [];

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: title,
          bold: true,
          size: 48,
          color: "000000"
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 400, after: 400 }
    })
  );

  const details = [
    { label: "Destino: ", value: `${destination.name} (${destination.country || "Brasil"})` },
    { label: "Ônibus: ", value: bus.name },
    { label: "Data: ", value: format(new Date(), "dd/MM/yyyy") }
  ];

  for (const d of details) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: d.label, size: 24 }),
          new TextRun({ text: d.value, size: 24 })
        ],
        spacing: { after: 100 }
      })
    );
  }

  return children;
}

function createTable(headers: string[], rows: any[][], docx: any) {
  const {
    Table,
    TableRow,
    TableCell,
    Paragraph,
    TextRun,
    WidthType,
    AlignmentType,
    VerticalAlign
  } = docx;

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map(h =>
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: h.toUpperCase(),
                    bold: true,
                    color: "FFFFFF",
                    size: 20
                  })
                ],
                alignment: AlignmentType.CENTER
              })
            ],
            verticalAlign: VerticalAlign.CENTER
          })
        )
      }),
      ...rows.map(row =>
        new TableRow({
          children: row.map(cell =>
            new TableCell({
              children: [
                new Paragraph({
                  children: [new TextRun({ text: String(cell), size: 20 })],
                  alignment: AlignmentType.CENTER
                })
              ],
              verticalAlign: VerticalAlign.CENTER
            })
          )
        })
      )
    ]
  });
}

// ------------------ generators ------------------

export async function generateEmbarqueWord(destination: any, bus: any, passengers: any[]) {
  const docx = await loadDocx();
  const { saveAs } = await loadFileSaver();
  const { Document, Packer, Paragraph } = docx;

  const header = await createHeader("LISTA DE EMBARQUE", destination, bus, docx);

  const rows = passengers.map((p: any, i: number) => [
    i + 1,
    p.client_name || "",
    p.client?.cpf || p.client?.rg || "-",
    p.seat_number,
    p.client?.departure_location || "-"
  ]);

  const doc = new Document({
    sections: [{
      children: [
        ...header,
        new Paragraph({ spacing: { before: 200 } }),
        createTable(["N°", "Nome", "RG/CPF", "Polt.", "Embarque"], rows, docx)
      ]
    }]
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Embarque_${destination.name}.docx`);
}

export async function generateListaCompletaWord(destination: any, bus: any, passengers: any[]) {
  const docx = await loadDocx();
  const { saveAs } = await loadFileSaver();
  const { Document, Packer, Paragraph } = docx;

  const header = await createHeader("LISTA COMPLETA", destination, bus, docx);

  const rows = passengers.map((p: any, i: number) => [
    i + 1,
    p.client_name || "",
    p.client?.cpf || p.client?.rg || "-",
    p.seat_number,
    p.client?.phone || "-"
  ]);

  const doc = new Document({
    sections: [{
      children: [
        ...header,
        new Paragraph({ spacing: { before: 200 } }),
        createTable(["N°", "Nome", "RG/CPF", "Polt.", "Telefone"], rows, docx)
      ]
    }]
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Lista_Completa_${destination.name}.docx`);
}

