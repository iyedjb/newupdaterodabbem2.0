import jsPDF from 'jspdf';
import autoTable, { UserOptions } from 'jspdf-autotable';
import type { Client, ClientWithChildren, Child } from '@/types';
import type { FinancialTransaction, Receipt } from '@shared/schema';


// Sanitize text for PDF to remove unsupported characters
function sanitizeTextForPDF(text: string): string {
  return text
    .replace(/[📊👥✈️✅❌⏳📄📅🔧📝📤💰]/g, '') // Remove emojis
    .replace(/['']/g, "'") // Replace smart quotes
    .replace(/[""]/g, '"') // Replace smart quotes
    .replace(/[–—]/g, '-') // Replace em/en dashes
    .trim();
}

// Simple function to convert number to words in Portuguese (basic implementation)
function numberToWords(value: number): string {
  if (value === 0) return 'zero reais';
  
  const units = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
  const teens = ['dez', 'onze', 'doze', 'treze', 'catorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
  const tens = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
  const hundreds = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];
  
  const reais = Math.floor(value);
  const centavos = Math.round((value - reais) * 100);
  
  function convertUpToThousand(num: number): string {
    if (num === 0) return '';
    if (num === 100) return 'cem';
    
    let result = '';
    const h = Math.floor(num / 100);
    const t = Math.floor((num % 100) / 10);
    const u = num % 10;
    
    if (h > 0) {
      result += hundreds[h];
      if (t > 0 || u > 0) result += ' e ';
    }
    
    if (t === 1) {
      result += teens[u];
    } else {
      if (t > 1) {
        result += tens[t];
        if (u > 0) result += ' e ';
      }
      if (u > 0 && t !== 1) {
        result += units[u];
      }
    }
    
    return result;
  }
  
  let result = '';
  
  if (reais >= 1000) {
    const thousands = Math.floor(reais / 1000);
    result += convertUpToThousand(thousands);
    if (thousands === 1) {
      result += ' mil';
    } else {
      result += ' mil';
    }
    
    const remainder = reais % 1000;
    if (remainder > 0) {
      result += ' e ' + convertUpToThousand(remainder);
    }
  } else {
    result += convertUpToThousand(reais);
  }
  
  if (reais === 1) {
    result += ' real';
  } else {
    result += ' reais';
  }
  
  if (centavos > 0) {
    result += ' e ' + convertUpToThousand(centavos);
    if (centavos === 1) {
      result += ' centavo';
    } else {
      result += ' centavos';
    }
  }
  
  return result;
}

// Function to create logo from SVG and add to PDF
async function addLogoToPDF(doc: jsPDF, x: number, y: number, width: number, height: number): Promise<void> {
  const textFallback = () => {
    doc.setFontSize(16);
    doc.setTextColor(108, 194, 74); // Green color
    doc.text('RODA BEM TURISMO', x, y + height/2);
  };
  
  try {
    // Create a temporary canvas to convert SVG to image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    // SVG data for the logo
    const svgData = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
        <circle cx="512" cy="512" r="450" fill="none" stroke="#6CC24A" stroke-width="20"/>
        <circle cx="512" cy="512" r="420" fill="none" stroke="#6CC24A" stroke-width="6"/>
        <circle cx="512" cy="200" r="92" fill="none" stroke="#6CC24A" stroke-width="8"/>
        <circle cx="512" cy="200" r="72" fill="none" stroke="#6CC24A" stroke-width="14"/>
        <g transform="translate(0,0)">
          <text x="512" y="232" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="112" font-weight="900" fill="#6CC24A">R</text>
        </g>
        <text x="512" y="520" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="110" font-weight="900" fill="#6CC24A" letter-spacing="6">RODA BEM</text>
        <text x="512" y="632" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-size="80" font-weight="900" fill="#6CC24A" letter-spacing="4">TURISMO</text>
        <rect x="128" y="606" width="200" height="12" rx="6" fill="#6CC24A"/>
        <rect x="696" y="606" width="200" height="12" rx="6" fill="#6CC24A"/>
        <text x="512" y="720" text-anchor="middle" font-family="Arial, sans-serif" font-size="36" fill="#6CC24A">sua melhor companhia</text>
      </svg>
    `;
    
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    
    return new Promise((resolve) => {
      const cleanup = () => {
        URL.revokeObjectURL(url);
        resolve();
      };
      
      // Set timeout to prevent hanging
      const timeout = setTimeout(() => {
        console.warn('Logo loading timeout, using text fallback');
        textFallback();
        cleanup();
      }, 2000);
      
      img.onload = () => {
        clearTimeout(timeout);
        try {
          canvas.width = width * 4; // Higher resolution
          canvas.height = height * 4;
          if (ctx) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const dataURL = canvas.toDataURL('image/png');
            doc.addImage(dataURL, 'PNG', x, y, width, height);
          }
        } catch (error) {
          console.warn('Error drawing logo:', error);
          textFallback();
        }
        cleanup();
      };
      
      img.onerror = () => {
        clearTimeout(timeout);
        console.warn('Logo loading failed, using text fallback');
        textFallback();
        cleanup();
      };
      
      img.src = url;
    });
  } catch (error) {
    console.warn('Could not initialize logo, using text instead:', error);
    textFallback();
  }
}

// Function to add professional header with logo
async function addProfessionalHeader(doc: jsPDF, title: string, subtitle?: string): Promise<number> {
  // Add logo
  await addLogoToPDF(doc, 15, 10, 35, 35);
  
  // Company name and title
  doc.setFontSize(18);
  doc.setTextColor(40, 40, 40);
  doc.text('RODA BEM TURISMO', 60, 25);
  
  doc.setFontSize(10);
  doc.setTextColor(108, 194, 74);
  doc.text('Agência de Viagens e Turismo', 60, 32);
  doc.text('sua melhor companhia', 60, 38);
  
  // Add horizontal line
  doc.setDrawColor(108, 194, 74);
  doc.setLineWidth(1);
  doc.line(15, 48, 195, 48);
  
  // Title
  doc.setFontSize(16);
  doc.setTextColor(40, 40, 40);
  doc.text(title, 15, 60);
  
  if (subtitle) {
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(subtitle, 15, 70);
    return 80;
  }
  
  return 70;
}

function addSimpleHeader(doc: jsPDF, title: string, subtitle?: string): number {
  // Company name
  doc.setFontSize(18);
  doc.setTextColor(40, 40, 40);
  doc.text('RODA BEM TURISMO', 15, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(108, 194, 74);
  doc.text('Agência de Viagens e Turismo', 15, 27);
  doc.text('sua melhor companhia', 15, 33);
  
  // Add horizontal line
  doc.setDrawColor(108, 194, 74);
  doc.setLineWidth(1);
  doc.line(15, 40, 195, 40);
  
  // Title
  doc.setFontSize(16);
  doc.setTextColor(40, 40, 40);
  doc.text(title, 15, 55);
  
  if (subtitle) {
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(subtitle, 15, 65);
    return 75;
  }
  
  return 65;
}

// Function to add professional footer
function addProfessionalFooter(doc: jsPDF): void {
  const pageCount = doc.getNumberOfPages();
  const pageHeight = (doc.internal.pageSize as any).getHeight ? (doc.internal.pageSize as any).getHeight() : doc.internal.pageSize.height;
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Footer line
    doc.setDrawColor(108, 194, 74);
    doc.setLineWidth(0.5);
    doc.line(15, pageHeight - 25, 195, pageHeight - 25);
    
    // Company contact info
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('RODA BEM TURISMO | CNPJ: 27.643.750/0019-0 | Tel: (31) 99932-5441', 15, pageHeight - 18);
    doc.text('Email: contato@rodabemturismo.com | www.rodabemturismo.com', 15, pageHeight - 13);
    
    // Page number and generation date
    doc.text(`Página ${i} de ${pageCount}`, 165, pageHeight - 18);
    doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')}`, 150, pageHeight - 13);
  }
}

// Function to add simple footer for contracts
function addSimpleFooter(doc: jsPDF): void {
  const pageCount = doc.getNumberOfPages();
  const pageHeight = (doc.internal.pageSize as any).getHeight ? (doc.internal.pageSize as any).getHeight() : doc.internal.pageSize.height;
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Simple footer with company info
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('RODA BEM TURISMO • CNPJ: 27.643.750/0019-0 • www.rodabemturismo.com', 15, pageHeight - 15);
    
    // Page number on the right
    doc.text(`Página ${i} de ${pageCount}`, 165, pageHeight - 15);
  }
}

export interface MonthlyReportData {
  clients: Client[];
  stats: {
    newClients: number;
    departures: number;
    revenue: number;
  };
}

export async function generateMonthlyReport(data: MonthlyReportData, month: string, year: string): Promise<void> {
  console.log('PDF Generator: Starting generation with data:', data);
  console.log('PDF Generator: Month:', month, 'Year:', year);
  
  try {
    const doc = new jsPDF();
    console.log('PDF Generator: jsPDF instance created successfully');
  
  // Professional header with logo
  const startY = await addProfessionalHeader(
    doc, 
    `Relatório Mensal - ${month}/${year}`,
    `Período de análise: ${month}/${year}`
  );
  
  // Stats summary
  doc.setFontSize(14);
  doc.setTextColor(40, 40, 40);
  doc.text('RESUMO DO MES', 15, startY + 10);
  
  const statsData = [
    ['Novos Clientes', (data.stats?.newClients ?? 0).toString()],
    ['Embarques Realizados', (data.stats?.departures ?? 0).toString()],
    ['Receita Total', `R$ ${(data.stats?.revenue ?? 0).toLocaleString('pt-BR')}`]
  ];
  
  autoTable(doc, {
    head: [['Métrica', 'Valor']],
    body: statsData,
    startY: startY + 20,
    theme: 'grid',
    headStyles: { 
      fillColor: [108, 194, 74],
      textColor: 255,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fillColor: [248, 249, 250]
    },
    alternateRowStyles: {
      fillColor: [255, 255, 255]
    },
    margin: { left: 15, right: 15 }
  });
  
  let currentY = startY + 80; // Track Y position based on header
  
  // Clients table
  if (data.clients.length > 0) {
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text('NOVOS CLIENTES DO MES', 15, currentY);
    currentY += 10;
    
    const clientsData = data.clients.map(client => [
      (client.first_name || '') + ' ' + (client.last_name || ''),
      client.email || 'N/A',
      client.destination || 'N/A',
      client.travel_price ? `R$ ${client.travel_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'N/A'
    ]);
    
    autoTable(doc, {
      head: [['Nome', 'Email', 'Destino', 'Valor']],
      body: clientsData,
      startY: currentY,
      theme: 'striped',
      headStyles: { 
        fillColor: [108, 194, 74],
        textColor: 255,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 9
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250]
      },
      margin: { left: 15, right: 15 },
      styles: { fontSize: 8 }
    });
    
    currentY += (clientsData.length * 6) + 40; // Update Y position
  }
  
    // Professional footer
    addProfessionalFooter(doc);
    
    console.log('PDF Generator: About to save file');
    // Download the PDF
    const filename = `Relatorio_Mensal_${month}_${year}_RodaBemTurismo.pdf`;
    doc.save(filename);
    console.log('PDF Generator: File saved successfully:', filename);
  } catch (error) {
    console.error('PDF Generator: Error during generation:', error);
    throw error;
  }
}

export interface ParcelasReportData {
  id: string;
  client_id: string;
  client_name: string;
  client_phone: string;
  amount: number;
  due_date: Date;
  installment_number: number;
  total_installments: number;
  is_paid: boolean;
  paid_date?: Date;
  paid_by_user_email?: string;
  payment_method?: string;
  observations?: string;
}

export interface ParcelasSummary {
  total: number;
  paid: number;
  pending: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
}

export async function generateParcelasReport(
  parcelas: ParcelasReportData[], 
  month: string, 
  year: string,
  summary: ParcelasSummary
): Promise<void> {
  console.log('PDF Generator: Starting parcelas report generation');
  
  try {
    const doc = new jsPDF();
    
    // Professional header with logo
    const startY = await addProfessionalHeader(
      doc, 
      `Relatório de Parcelas - ${month}/${year}`,
      `Período: ${month} de ${year}`
    );
    
    // Summary cards section
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text('RESUMO', 15, startY + 10);
    
    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(value);
    };
    
    const summaryData = [
      ['Total de Parcelas', summary.total.toString(), formatCurrency(summary.totalAmount)],
      ['Parcelas Pagas', summary.paid.toString(), formatCurrency(summary.paidAmount)],
      ['Parcelas Pendentes', summary.pending.toString(), formatCurrency(summary.pendingAmount)],
    ];
    
    autoTable(doc, {
      head: [['Categoria', 'Quantidade', 'Valor']],
      body: summaryData,
      startY: startY + 15,
      theme: 'grid',
      headStyles: { 
        fillColor: [108, 194, 74],
        textColor: 255,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fillColor: [248, 249, 250]
      },
      alternateRowStyles: {
        fillColor: [255, 255, 255]
      },
      margin: { left: 15, right: 15 }
    });
    
    let currentY = startY + 75;
    
    // Parcelas details table
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text('DETALHAMENTO DAS PARCELAS', 15, currentY);
    currentY += 10;
    
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    };
    
    const parcelasData = parcelas.map(p => [
      sanitizeTextForPDF(p.client_name),
      p.client_phone,
      formatDate(p.due_date),
      `${p.installment_number}/${p.total_installments}`,
      formatCurrency(p.amount),
      p.is_paid ? 'Pago' : 'Pendente',
      p.is_paid && p.paid_date ? formatDate(p.paid_date) : '-',
    ]);
    
    autoTable(doc, {
      head: [['Cliente', 'Telefone', 'Vencimento', 'Parcela', 'Valor', 'Status', 'Data Pgto']],
      body: parcelasData,
      startY: currentY,
      theme: 'striped',
      headStyles: { 
        fillColor: [108, 194, 74],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 9
      },
      bodyStyles: {
        fontSize: 8
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250]
      },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 28 },
        2: { cellWidth: 22 },
        3: { cellWidth: 18 },
        4: { cellWidth: 25 },
        5: { cellWidth: 18 },
        6: { cellWidth: 22 },
      },
      margin: { left: 15, right: 15 },
      didParseCell: function(data) {
        if (data.section === 'body' && data.column.index === 5) {
          if (data.cell.raw === 'Pago') {
            data.cell.styles.textColor = [34, 139, 34];
            data.cell.styles.fontStyle = 'bold';
          } else {
            data.cell.styles.textColor = [255, 140, 0];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    });
    
    // Professional footer
    addProfessionalFooter(doc);
    
    // Download the PDF
    const filename = `Relatorio_Parcelas_${month}_${year}_RodaBemTurismo.pdf`;
    doc.save(filename);
    console.log('PDF Generator: Parcelas report saved successfully:', filename);
  } catch (error) {
    console.error('PDF Generator: Error during parcelas report generation:', error);
    throw error;
  }
}

export async function generateTravelContract(client: ClientWithChildren, createdBy?: string): Promise<void> {
  // Choose the appropriate contract type based on client.contract_type
  const contractType = client.contract_type || 'normal';
  
  if (contractType === 'bate_volta') {
    return await generateBateVoltaContract(client, createdBy);
  }
  
  // Default to normal contract
  return await generateNormalContract(client, createdBy);
}

export async function generateNormalContract(client: ClientWithChildren, createdBy?: string): Promise<void> {
  const doc = new jsPDF();
  
  let currentY = 20;
  
  // Fetch destination details if available
  let destinationDetails: any = null;
  try {
    const response = await fetch('/api/destinations/active', {
      cache: 'no-store'
    });
    if (response.ok) {
      const destinations = await response.json();
      destinationDetails = destinations.find((d: any) => d.name === client.destination);
    }
  } catch (error) {
    console.warn('Could not fetch destination details for contract:', error);
  }
  
  // Add green background - more prominent green
  doc.setFillColor(200, 235, 200); // More noticeable green background
  doc.rect(0, 0, 210, 297, 'F');
  
  // Add professional header with green styling
  doc.setFillColor(108, 194, 74); // Green background for header
  doc.rect(10, 10, 190, 40, 'F');
  
  // Add white border for header
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(2);
  doc.rect(10, 10, 190, 40);
  
  // Add agency logo prominently at the top left AFTER header background
  await addLogoToPDF(doc, 15, 15, 30, 30);
  
  // Header title
  doc.setFontSize(20);
  doc.setTextColor(0, 0, 0); // Black text as requested
  doc.text('CONTRATO', 105, 25, { align: 'center' });
  
  doc.setFontSize(14);
  doc.text('De Prestação de Serviços de Turismo', 105, 40, { align: 'center' });
  
  currentY = 70;
  
  // Two-column layout like the original
  const leftColumnX = 15;
  const rightColumnX = 105;
  const columnWidth = 85;
  
  // Left column - CONTRATANTE with green background
  let leftY = currentY;
  
  // Add light green background for section header (lighter for black text readability)
  doc.setFillColor(220, 245, 220);
  doc.rect(leftColumnX - 2, leftY - 6, 85, 12, 'F');
  
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0); // Black text as requested
  doc.text('CONTRATANTE', leftColumnX, leftY);
  leftY += 10;
  
  // Format birthdate safely without timezone issues
  const formatDateSafely = (dateInput: string | Date): string => {
    if (!dateInput) return 'data de nascimento não informada';
    
    if (typeof dateInput === 'string') {
      // For ISO date strings (YYYY-MM-DD), split and format directly
      const parts = dateInput.split('T')[0].split('-'); // Handle both YYYY-MM-DD and ISO datetime
      if (parts.length === 3) {
        const [year, month, day] = parts;
        return `${day}/${month}/${year}`;
      }
    }
    
    // Fallback for Date objects
    if (dateInput instanceof Date) {
      return dateInput.toLocaleDateString('pt-BR');
    }
    
    return 'data de nascimento não informada';
  };
  
  const birthdateStr = formatDateSafely(client.birthdate);
  
  const contractorInfo = sanitizeTextForPDF(`${client.first_name} ${client.last_name}, brasileiro(a), ${client.civil_status || 'estado civil não informado'}, ${client.profession || 'profissão não informada'}, nascido(a) em ${birthdateStr}, portador do RG de n.º ${client.rg || '(...)'}, inscrito no CPF sob o n.º ${client.cpf || '(...)'}, telefone ${client.phone || 'não informado'}, e-mail ${client.email || 'não informado'}, residente e domiciliado à ${client.address || '(endereço)'}, ${client.city || '(cidade)'}, ${client.state || '(estado)'}, CEP n.º ${client.postal_code || '(...)'}.`);
  
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0); // Ensure black text
  const contractorLines = doc.splitTextToSize(contractorInfo, columnWidth);
  doc.text(contractorLines, leftColumnX, leftY);
  leftY += contractorLines.length * 4 + 15;
  
  // CONTRATADA with green background
  // Add light green background for section header (lighter for black text readability)
  doc.setFillColor(220, 245, 220);
  doc.rect(leftColumnX - 2, leftY - 6, 85, 12, 'F');
  
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0); // Black text as requested
  doc.text('CONTRATADA', leftColumnX, leftY);
  leftY += 10;
  
  const contractedInfo = sanitizeTextForPDF('RODA BEM TURISMO, pessoa jurídica de direito privado, sediada à Rua Visconde de Caeté, n.º 44, no bairro Centro, no município de Esmeraldas – MG, CEP n.º 35740-000, inscrita no CNPJ sob o n.º 27.643.750/0019-0, nesse ato representada por seu diretor Daniel de Paiva Rezende Oliveira, brasileiro, casado, empresário, portador do RG de n.º MG-7.713.081 e inscrito no CPF sob o n.º 042.361.466-57.');
  
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0); // Black text for all content
  const contractedLines = doc.splitTextToSize(contractedInfo, columnWidth);
  doc.text(contractedLines, leftColumnX, leftY);
  
  // Right column - Introduction text
  let rightY = currentY;
  const introText = sanitizeTextForPDF('As partes identificadas ao lado acordaram e formalizaram o presente Contrato de Prestação de Serviços de Turismo. Este contrato será regido pelas cláusulas a seguir e pelas condições descritas no presente documento, tudo à luz do Código de Defesa do Consumidor, da Deliberação Normativa da Embratur e texto da Associação brasileira das Operadoras de Turismo - BRAZTOA.');
  
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0); // Ensure black text
  const introLines = doc.splitTextToSize(introText, columnWidth);
  doc.text(introLines, rightColumnX, rightY);
  rightY += introLines.length * 4 + 20;
  
  // Contact information with light green styling
  doc.setFillColor(220, 245, 220);
  doc.rect(rightColumnX - 4, rightY - 8, 88, 30, 'F');
  
  doc.setDrawColor(108, 194, 74);
  doc.setLineWidth(1);
  doc.rect(rightColumnX - 4, rightY - 8, 88, 30);
  
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0); // Black text as requested
  doc.text('EM CASO DE DÚVIDA:', rightColumnX, rightY);
  rightY += 8;
  
  doc.setFontSize(14);
  doc.text('(31) 99932-5441', rightColumnX, rightY);
  rightY += 8;
  
  // Set currentY to the maximum of both columns
  currentY = Math.max(leftY + contractedLines.length * 4, rightY) + 20;
  
  // Check if we need a new page
  if (currentY > 230) {
    doc.addPage();
    currentY = 20;
  }
  
  // DO OBJETO section with light green background
  doc.setFillColor(220, 245, 220);
  doc.rect(10, currentY - 8, 190, 16, 'F');
  
  doc.setDrawColor(108, 194, 74);
  doc.setLineWidth(1);
  doc.rect(10, currentY - 8, 190, 16);
  
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0); // Black text as requested
  doc.text('DO OBJETO', 15, currentY);
  currentY += 15;
  
  // Main clause text
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0); // Ensure black text
  const clauseText = sanitizeTextForPDF(`Cláusula n.º 1. A contratada ofertará ao contratante, e aos eventuais passageiros descritos em cláusula própria, o pacote de viagem denominado "${client.destination || 'Destino a definir'}", compreendido pelo que se segue:`);
  const clauseLines = doc.splitTextToSize(clauseText, 180);
  doc.text(clauseLines, 15, currentY);
  currentY += clauseLines.length * 4 + 15;
  
  // Package details with client data - matching original format
  let travelDate = 'A definir';
  let returnDate = 'A definir';
  
  // Calculate dates from destination details
  if (destinationDetails?.periodo_viagem_inicio && destinationDetails?.periodo_viagem_fim) {
    const startDate = new Date(destinationDetails.periodo_viagem_inicio);
    const endDate = new Date(destinationDetails.periodo_viagem_fim);
    if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
      travelDate = startDate.toLocaleDateString('pt-BR');
      returnDate = endDate.toLocaleDateString('pt-BR');
    }
  }
  
  const packageDetails = [
    { label: 'PACOTE DE VIAGEM:', value: client.destination || 'Destino a definir' },
    { label: 'PERÍODO DA VIAGEM:', value: `${travelDate} – ${returnDate}` },
    { label: 'LOCAL DE EMBARQUE:', value: destinationDetails?.embarque || client.departure_location || 'A definir conforme destino' },
    { label: 'LOCAL DE RETORNO:', value: destinationDetails?.retorno || client.return_location || 'A definir conforme destino' },
    { label: 'ROTEIRO DE VIAGEM:', value: client.travel_itinerary || 'O roteiro de viagem está descrito no guia de viagem anexo ao presente contrato.' },
    { label: 'TRANSPORTE:', value: destinationDetails?.transporte || 'Ônibus de turismo de categoria luxo, guarnecido de poltronas reclináveis com USB para carregamento de celulares, semi-leito, ar condicionado, toilette químico, serviço de bordo e guia acompanhante.' },
    { label: 'POLTRONA(S):', value: 'A definir' },
    { label: 'HOSPEDAGEM:', value: destinationDetails?.hospedagem || 'Conforme descrito no roteiro de viagem, com acomodações adequadas ao padrão do pacote contratado.' },
    { label: 'PASSEIOS ADICIONAIS:', value: destinationDetails?.passeios_adicionais || 'Compõe o pacote de viagem os passeios descritos no guia de viagem anexo ao presente contrato.' }
  ];
  
  // Format with improved layout
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  
  packageDetails.forEach((detail, index) => {
    // Check for page break before each item
    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }
    
    // Label in bold
    doc.setFont('helvetica', 'bold');
    doc.text(detail.label, 15, currentY);
    currentY += 5;
    
    // Value with proper text wrapping
    doc.setFont('helvetica', 'normal');
    const valueLines = doc.splitTextToSize(detail.value, 175);
    doc.text(valueLines, 15, currentY);
    currentY += valueLines.length * 5 + 3;
    
    // Add spacing between items
    if (index < packageDetails.length - 1) {
      currentY += 2;
    }
  });
  
  // Note about additional tours
  currentY += 5;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.text('(Valores cobrados à parte)', 15, currentY);
  doc.setFont('helvetica', 'normal');
  currentY += 15;
  
  // Check if we need a new page
  if (currentY > 230) {
    doc.addPage();
    currentY = 20;
  }
  
  // DO VALOR E DA FORMA DE PAGAMENTO with light green background
  doc.setFillColor(220, 245, 220);
  doc.rect(10, currentY - 8, 190, 16, 'F');
  
  doc.setDrawColor(108, 194, 74);
  doc.setLineWidth(1);
  doc.rect(10, currentY - 8, 190, 16);
  
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0); // Black text as requested
  doc.text('DO VALOR E DA FORMA DE PAGAMENTO', 15, currentY);
  currentY += 15;
  
  // Main clause text
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0); // Ensure black text
  const paymentClause = sanitizeTextForPDF(`Cláusula n.º 2. O valor unitário do pacote de viagem "${client.destination || 'Destino a definir'}" e a forma de pagamento que o contratante realizará em favor da Contratada se dará da seguinte maneira:`);
  const paymentClauseLines = doc.splitTextToSize(paymentClause, 180);
  doc.text(paymentClauseLines, 15, currentY);
  currentY += paymentClauseLines.length * 4 + 15;
  
  // Payment details using client data - with original layout
  // Calculate total price including children/company members
  const basePrice = client.travel_price || 0;
  const childrenTotal = (client.children || []).reduce((sum, child) => sum + (child.price || 0), 0);
  const totalPrice = basePrice + childrenTotal;
  const formattedPrice = totalPrice ? totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : 'A definir';
  
  // Payment method mapping
  const paymentMethodLabels = {
    'avista': 'À Vista',
    'pix': 'PIX',
    'crediario_agencia': 'Crediário da Agência',
    'credito_banco': 'Crédito do Banco',
    'boleto': 'Boleto Bancário',
    'link': 'Link'
  };
  
  const paymentMethodLabel = client.payment_method ? (paymentMethodLabels[client.payment_method] || 'A definir') : 'A definir';
  
  // Create the payment box layout like the original with borders
  const boxStartY = currentY;
  const leftBoxX = 15;
  const rightBoxX = 115;
  const boxHeight = client.payment_method && ['crediario_agencia', 'credito_banco', 'boleto', 'link'].includes(client.payment_method) ? 60 : 40;
  
  // Draw the main payment box
  
  // Add border
  doc.setDrawColor(0, 0, 0); // Black border
  doc.setLineWidth(1);
  doc.rect(leftBoxX, boxStartY, 180, boxHeight);
  
  // Draw vertical separator between left and right sides
  doc.setLineWidth(1);
  doc.line(rightBoxX - 5, boxStartY, rightBoxX - 5, boxStartY + boxHeight);
  
  // Left side - Investment amount
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0); // Black text
  doc.text('Investimento total:', leftBoxX + 5, currentY + 15);
  doc.text(`${totalPrice ? `R$ ${formattedPrice}` : formattedPrice}`, leftBoxX + 5, currentY + 25);
  
  let leftSideCurrentY = currentY + 35;
  
  if (totalPrice) {
    // Add actual amount in words
    doc.setFontSize(9);
    const amountInWords = `(${numberToWords(totalPrice)})`;
    const wordsLines = doc.splitTextToSize(amountInWords, 90);
    doc.text(wordsLines, leftBoxX + 5, leftSideCurrentY);
    leftSideCurrentY += wordsLines.length * 4 + 5;
  }
  
  // Add down payment information if available
  if (client.down_payment && client.down_payment > 0) {
    doc.setFontSize(10);
    doc.text('Entrada:', leftBoxX + 5, leftSideCurrentY);
    doc.text(`R$ ${client.down_payment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, leftBoxX + 5, leftSideCurrentY + 8);
  }
  
  // Right side - Payment details
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0); // Black text
  doc.text('Forma de pagamento:', rightBoxX, currentY + 15);
  doc.text(paymentMethodLabel, rightBoxX, currentY + 23);
  
  // Show installment details only for credit and boleto methods
  if (client.payment_method && ['crediario_agencia', 'credito_banco', 'boleto', 'link'].includes(client.payment_method)) {
    // Calculate installment details if data is available
    const installmentsCount = client.installments_count || 'A definir';
    const downPayment = client.down_payment || 0;
    const remainingAmount = totalPrice && downPayment ? totalPrice - downPayment : totalPrice;
    
    let installmentValue = 'A definir';
    if (remainingAmount && client.installments_count && client.installments_count > 0) {
      const calculatedValue = remainingAmount / client.installments_count;
      installmentValue = `R$ ${calculatedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    }
    
    doc.text(`N.º de parcelas: ${installmentsCount}`, rightBoxX, currentY + 31);
    doc.text(`Valor das parcelas: ${installmentValue}`, rightBoxX, currentY + 39);
    doc.text(`Vencimento: ${client.installment_due_date || 'A definir'}`, rightBoxX, currentY + 47);
    doc.text('O vencimento da primeira', rightBoxX, currentY + 55);
    doc.text(`parcela será: ${client.first_installment_due_date || 'A definir'}`, rightBoxX, currentY + 63);
    currentY += boxHeight + 20;
  } else {
    currentY += boxHeight + 20;
  }
  
  // Payment terms paragraphs - exactly as in document
  const paymentTerms = [
    sanitizeTextForPDF('PARÁGRAFO PRIMEIRO. O Contratante poderá utilizar o pacote de viagem SOMENTE após a quitação de todas as parcelas pactuadas.'),
    
    sanitizeTextForPDF('PARÁGRAFO SEGUNDO. O atraso injustificado no pagamento de quaisquer dos boletos sujeitará o contratante ao pagamento de multa no valor equivalente a 2% (dois por cento) sobre o valor da parcela, consoante previsão legal do artigo 52, §1º, do Código de Defesa do Consumidor, acrescido de juros moratórios de 1% por mês e correção monetária pelo índice IGP-M, da Fundação Getúlio Vargas, ou outro que lhe vier substituir, até a data do efetivo pagamento.'),
    
    sanitizeTextForPDF('PARÁGRAFO TERCEIRO. Em caso de atraso ou não pagamento por prazo igual ou superior a 30 (trinta) dias da data estabelecida para o vencimento da parcela, ficará caracterizada a inadimplência contratual do Contratante, dando motivo à imediata rescisão do contrato ora firmado, perdendo o Contratante em favor da Contratada, à título de perdas e danos, os valores pagos até a data da rescisão contratual.'),
    
    sanitizeTextForPDF('PARÁGRAFO QUARTO. Em caso de inadimplência contratual, as partes estabelecem vencimento antecipado de todas as parcelas, podendo a Contratada promover a cobrança da totalidade do débito através de ação executória, acrescidos de correção monetária e juros, após a notificação extrajudicial do Contratante.'),
    
    sanitizeTextForPDF('PARÁGRAFO QUINTO. O valor mencionado não inclui eventuais gorjetas, ingressos em qualquer ponto turístico visitado no decorrer da viagem (como museus, castelos, teleféricos, metrôs, bondes, torres, parques, shows...), taxas de guarda-bagagens, bebidas, frigobar, despesas com documentação, lavanderia, telefonemas e outros extras de caráter estritamente pessoal; passeios opcionais sugeridos nos programas; voos, pernoites ou refeições que por motivos alheios à situação da Contratada precisem ser feitos fora da programação original.'),
    
    sanitizeTextForPDF('PARÁGRAFO SEXTO. As partes realizam, neste ato, de livre e espontânea vontade, o seguinte negócio processual, na forma prevista no art. 190 do Código de Processo Civil: caso o contratante deixe de cumprir qualquer obrigação de pagar referente à presente contratação, levando a contratada a ingressar com ação executiva para o recebimento dos valores que lhe são devidos, o contratante autoriza, desde já, a realização de arresto cautelar e de penhora de até 30% do salário líquido ou de quaisquer valores que lhe sejam devidos.')
  ];
  
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0); // Reset to black for paragraph text
  paymentTerms.forEach(term => {
    // Check for page break before adding term
    if (currentY > 220) {
      doc.addPage();
      currentY = 20;
    }
    const lines = doc.splitTextToSize(term, 180);
    doc.text(lines, 15, currentY);
    currentY += lines.length * 4 + 8;
  });
  
  // Check if we need a new page
  if (currentY > 200) {
    doc.addPage();
    currentY = 20;
  }
  
  // DOS PASSAGEIROS section with professional background
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0); // Black text
  doc.text('DOS PASSAGEIROS:', 15, currentY);
  currentY += 15;
  
  doc.setFontSize(10);
  doc.text('Cláusula de n.º 3. O Contratante contrata o pacote de viagem descrito na cláusula', 15, currentY);
  currentY += 5;
  doc.text('de n.º 1 para si, e para as demais pessoas abaixo nomeadas:', 15, currentY);
  currentY += 15;
  
  // Show table with passenger data (children/dependents)
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0); // Black text for table headers
  doc.text('NOME', 15, currentY);
  doc.text('RG', 85, currentY);
  doc.text('CPF', 125, currentY);
  doc.text('DATA DE NASC.', 165, currentY);
  currentY += 8;
  
  // If there are children, populate the table with their data
  if (client.children && client.children.length > 0) {
    client.children.forEach((child) => {
      // Check for page break
      if (currentY > 270) {
        doc.addPage();
        currentY = 20;
        // Re-render table headers after page break
        doc.setFontSize(9);
        doc.text('NOME', 15, currentY);
        doc.text('RG', 85, currentY);
        doc.text('CPF', 125, currentY);
        doc.text('DATA DE NASC.', 165, currentY);
        currentY += 8;
      }
      
      // Draw row data
      doc.text(sanitizeTextForPDF(child.name || ''), 15, currentY);
      doc.text(child.rg || '', 85, currentY);
      doc.text(child.cpf || '', 125, currentY);
      doc.text(child.birthdate ? formatDateSafely(child.birthdate) : '', 165, currentY);
      
      // Draw line below row
      doc.setDrawColor(180, 180, 180); // Light gray lines
      doc.line(15, currentY + 2, 190, currentY + 2);
      currentY += 8;
    });
    
    // Add empty rows if less than 10 children
    const emptyRows = Math.max(0, 10 - client.children.length);
    for (let i = 0; i < emptyRows; i++) {
      if (currentY > 270) {
        doc.addPage();
        currentY = 20;
      }
      doc.setDrawColor(180, 180, 180);
      doc.line(15, currentY, 190, currentY);
      currentY += 8;
    }
  } else {
    // Show empty table for manual filling if no children
    doc.setDrawColor(180, 180, 180); // Light gray lines
    for (let i = 0; i < 10; i++) {
      doc.line(15, currentY, 190, currentY);
      currentY += 8;
    }
  }
  
  // Add border around the table
  const tableHeight = 10 * 8;
  const tableTop = currentY - tableHeight;
  doc.setDrawColor(0, 0, 0); // Black border
  doc.setLineWidth(0.5);
  doc.rect(15, tableTop - 8, 175, tableHeight + 8);
  currentY += 15;
  
  // Check if we need a new page
  if (currentY > 200) {
    doc.addPage();
    currentY = 20;
  }
  
  // DO TRANSPORTE section with professional background
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0); // Black text
  doc.text('DO TRANSPORTE', 15, currentY);
  currentY += 15;
  
  const transportClauses = [
    sanitizeTextForPDF('Cláusula de n.º 4. O transporte de ida ao local de destino da viagem, e o retorno deste, se dará por empresas terceirizadas, de escolha e de responsabilidade da Contratada, em ônibus "DD" ou "LD" de categoria turismo luxo, podendo ser de visão panorâmica ou não.'),
    
    sanitizeTextForPDF('Cláusula de n.º 5. Na hipótese de interrupção da viagem por motivo alheio à vontade do transportador, como em casos decorrentes de falha mecânica, por exemplo, a Contratada se compromete a substituir o veículo por outro de igual categoria ou superior, ou, caso haja a anuência do Contratante, por veículo diverso, à sua custa, entretanto, consoante previsão legal do artigo 741 do Código Civil.'),
    
    sanitizeTextForPDF('Cláusula de n.º 6. Como cortesia, oferta a Contratada ao Contratante a gratuidade de transporte para uma criança de 0 (zero) a 4 (quatro) anos que realize o percurso integralmente no colo – sendo limitado a 1 (uma) criança por quarto reservado no hotel.'),
    
    sanitizeTextForPDF('Cláusula de n.º 7. Devido à capacidade limitada do bagageiro do ônibus, cada passageiro terá direito ao transporte de uma mala, não excedente a 70x50x20cm, que será transportado no bagageiro do veículo, bem como terá direito ao transporte de uma bagagem de mão, tipo fresqueira, que pode ter até 5 kg de peso, e as seguintes dimensões 26x78x48cm, a qual deverá ser armazenada no maleiro, acima das cadeiras. Malas excedentes terão uma cobrança adicional para cobrir despesas de frete.'),
    
    sanitizeTextForPDF('Cláusula de n.º 8. O extravio comprovado de malas com etiquetas do Contratante transportadas nos translados e viagens terrestres, desde que considerada bagagem permitida, será ressarcido, desde que comprovada falha da Contratada. Caso sejam contratados serviços de terceiros pelo Contratante para transporte de bagagens, o extravio corre por responsabilidade deles.')
  ];
  
  doc.setFontSize(9);
  transportClauses.forEach(clause => {
    // Check for page break before adding clause
    if (currentY > 220) {
      doc.addPage();
      currentY = 20;
    }
    const lines = doc.splitTextToSize(clause, 180);
    doc.text(lines, 15, currentY);
    currentY += lines.length * 4 + 8;
  });
  
  // Check if we need a new page
  if (currentY > 200) {
    doc.addPage();
    currentY = 20;
  }
  
  // DA HOSPEDAGEM section with professional background
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0); // Black text
  doc.text('DA HOSPEDAGEM', 15, currentY);
  currentY += 15;
  
  const accommodationClauses = [
    sanitizeTextForPDF('Cláusula de n.º 9. O hotel reservado, indicado na cláusula de n.º 1, de categoria turística, foi previamente apresentado pela Contratada ao Contratante por meio de serviço eletroeletrônico ou catálogo, havendo anuência do Contratante na reserva do quarto/apartamento apontado. Dessa forma, se por algum motivo, salvo aquele resultante de caso fortuito ou força maior, não houver a disponibilização do quarto/apartamento indicado ao Contratante, se compromete a Contratada a oferecer outro de igual categoria ou superior, sem qualquer ônus ao Contratante.'),
    
    sanitizeTextForPDF('Cláusula de n.º 10. A acomodação, como indicado na cláusula de n.º 1, por opção do Contratante, se dará na modalidade "apartamento duplo", sendo esta modalidade àquela em que duas pessoas compartilham do mesmo quarto/apartamento. Dessa forma, caso o Contratante tenha o desejo de alterar para um quarto/apartamento "single", sendo este o utilizado por apenas uma pessoa, deverá suportar a diferença de custo dos quartos/apartamentos, com total responsabilidade destes.')
  ];
  
  doc.setFontSize(9);
  accommodationClauses.forEach(clause => {
    // Check for page break before adding clause
    if (currentY > 200) {
      doc.addPage();
      currentY = 20;
    }
    const lines = doc.splitTextToSize(clause, 180);
    doc.text(lines, 15, currentY);
    currentY += lines.length * 4 + 8;
  });
  
  // Check if we need a new page
  if (currentY > 200) {
    doc.addPage();
    currentY = 20;
  }
  
  // DA DOCUMENTAÇÃO DA VIAGEM section with professional background
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0); // Black text
  doc.text('DA DOCUMENTAÇÃO DA VIAGEM', 15, currentY);
  currentY += 15;
  
  const documentationClauses = [
    sanitizeTextForPDF('Cláusula de n.º 11. O contratante declara estar ciente de que é indispensável portar cédula de identidade emitida pela SSP, ou outro órgão de plena validade nacional, durante todo os momentos da viagem, a qual deve se encontrar em bom estado e com data de emissão de até 10 (dez) anos.'),
    
    sanitizeTextForPDF('PARÁGRAFO PRIMEIRO. Menores de 18 (dezoito) anos, desacompanhados do pai ou da mãe, ou de ambos, devem portar, além da cédula de identidade (ou certidão de nascimento), autorização competente e uma carta com firma reconhecida dos responsáveis para a viagem.'),
    
    sanitizeTextForPDF('PARÁGRAFO SEGUNDO. A falta de documentação adequada exime a Contratada de quaisquer responsabilidades, inclusive de reembolso.')
  ];
  
  doc.setFontSize(9);
  documentationClauses.forEach(clause => {
    // Check for page break before adding clause
    if (currentY > 200) {
      doc.addPage();
      currentY = 20;
    }
    const lines = doc.splitTextToSize(clause, 180);
    doc.text(lines, 15, currentY);
    currentY += lines.length * 4 + 8;
  });
  
  // Check if we need a new page
  if (currentY > 200) {
    doc.addPage();
    currentY = 20;
  }
  
  // DAS INFORMAÇÕES IMPORTANTES À VIAGEM section with professional background
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0); // Black text
  doc.text('DAS INFORMAÇÕES IMPORTANTES À VIAGEM', 15, currentY);
  currentY += 15;
  
  const importantInfoClauses = [
    sanitizeTextForPDF('Cláusula de n.º 12. Para observância dos horários de saída das viagens, poderá haver uma tolerância de 15 (quinze) minutos para atraso do passageiro. Após essa tolerância não caberá qualquer reclamação ou indenização.'),
    
    sanitizeTextForPDF('Cláusula de n.º 13. Para o correto andamento da viagem ou por motivos técnicos, a ordem do programa de viagem poderá ser invertida ou alterada.'),
    
    sanitizeTextForPDF('Cláusula de n.º 14. Caso ocorra atraso na programação da viagem, motivado por interrupção de estrada, enguiço mecânico ou qualquer outro motivo alheio à vontade da Contratada, o tempo de permanência no local será considerado como se de viagem fosse, não sendo devido pela Contratada qualquer devolução ou pernoite(s) compensatória(s).'),
    
    sanitizeTextForPDF('Cláusula de n.º 15. O passageiro acometido por doença grave ou portador de aparelhos de ajuda cardíaca ou respiratória, ou similar, ou qualquer outra doença, deve declarar sua condição e viajar coberto ou assistido por seguro. O risco de viagem, em face de quaisquer das condições narradas, é de responsabilidade do passageiro.'),
    
    sanitizeTextForPDF('Cláusula de n.º 16. Em caso de compras de ingressos ou entradas para shows, teatros ou eventos em geral, o Contratante declara concordar com o preço e a localização dos assentos, estando ciente que não haverá devolução de valores em nenhuma hipótese.'),
    
    sanitizeTextForPDF('PARÁGRAFO ÚNICO. O ingresso, uma vez entregue pela Contratada à pessoa autorizada a recebê-lo, não será responsabilizada em caso de perda, extravio, furto ou esquecimento, cabendo ao receptor a total responsabilidade do ingresso.')
  ];
  
  doc.setFontSize(9);
  importantInfoClauses.forEach(clause => {
    // Check for page break before adding clause
    if (currentY > 200) {
      doc.addPage();
      currentY = 20;
    }
    const lines = doc.splitTextToSize(clause, 180);
    doc.text(lines, 15, currentY);
    currentY += lines.length * 4 + 6;
  });
  
  // Check if we need a new page
  if (currentY > 200) {
    doc.addPage();
    currentY = 20;
  }
  
  // DA AUTORIZAÇÃO PARA USO DE IMAGEM section with professional background - VERY CLEAR
  // Add prominent yellow background to make this section stand out
  doc.setFillColor(255, 255, 200);
  doc.rect(10, currentY - 8, 190, 16, 'F');
  
  doc.setDrawColor(255, 200, 0);
  doc.setLineWidth(2);
  doc.rect(10, currentY - 8, 190, 16);
  
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('DA AUTORIZAÇÃO PARA USO DE IMAGEM E MARKETING', 15, currentY);
  doc.setFont('helvetica', 'normal');
  currentY += 15;
  
  // Add light yellow background for clause text to make it very visible
  doc.setFillColor(255, 255, 230);
  const imageAuthStartY = currentY - 5;
  
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  const imageAuthClause = sanitizeTextForPDF('Cláusula de n.º 18. AUTORIZAÇÃO PARA USO DE IMAGEM: O Contratante autoriza expressamente e de forma irrevogável a Contratada a captar, através de terceiros ou de forma direta, fotografias e vídeos do Contratante e de seus familiares ou beneficiários durante a viagem.');
  doc.setFont('helvetica', 'normal');
  const imageAuthLines = doc.splitTextToSize(imageAuthClause, 180);
  doc.text(imageAuthLines, 15, currentY);
  currentY += imageAuthLines.length * 4 + 5;
  
  doc.setFontSize(9);
  const marketingClause = sanitizeTextForPDF('PARÁGRAFO PRIMEIRO. As imagens e vídeos captados poderão ser utilizados pela Contratada para fins de marketing, publicidade, divulgação nas redes sociais (Facebook, Instagram, TikTok, YouTube e outras plataformas), site institucional, materiais promocionais impressos e digitais, sem qualquer limitação de tempo ou território.');
  const marketingLines = doc.splitTextToSize(marketingClause, 180);
  doc.text(marketingLines, 15, currentY);
  currentY += marketingLines.length * 4 + 5;
  
  const compensationClause = sanitizeTextForPDF('PARÁGRAFO SEGUNDO. O Contratante declara estar ciente de que não receberá qualquer tipo de compensação financeira ou contraprestação pecuniária pelo uso de sua imagem, abrindo mão de qualquer direito neste sentido.');
  const compensationLines = doc.splitTextToSize(compensationClause, 180);
  doc.text(compensationLines, 15, currentY);
  currentY += compensationLines.length * 4 + 5;
  
  // Draw background behind the entire clause
  const imageAuthHeight = currentY - imageAuthStartY;
  doc.setFillColor(255, 255, 230);
  doc.rect(10, imageAuthStartY, 190, imageAuthHeight, 'F');
  
  // Redraw text over background
  let tempY = imageAuthStartY + 5;
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(imageAuthLines, 15, tempY);
  tempY += imageAuthLines.length * 4 + 5;
  
  doc.setFontSize(9);
  doc.text(marketingLines, 15, tempY);
  tempY += marketingLines.length * 4 + 5;
  
  doc.text(compensationLines, 15, tempY);
  
  currentY += 10;
  
  // Check if we need a new page
  if (currentY > 230) {
    doc.addPage();
    currentY = 20;
  }
  
  // DO DIREITO DE DESISTÊNCIA E CANCELAMENTO section with professional background - VERY CLEAR
  // Add prominent red/orange background to make this section stand out
  doc.setFillColor(255, 230, 230);
  doc.rect(10, currentY - 8, 190, 16, 'F');
  
  doc.setDrawColor(220, 53, 69);
  doc.setLineWidth(2);
  doc.rect(10, currentY - 8, 190, 16);
  
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('DO DIREITO DE DESISTÊNCIA E POLÍTICA DE CANCELAMENTO', 15, currentY);
  doc.setFont('helvetica', 'normal');
  currentY += 15;
  
  const cancellationClauses = [
    sanitizeTextForPDF('Cláusula de n.º 17. POLÍTICA DE CANCELAMENTO E CRÉDITO: Caso o Contratante cancele a viagem após ter efetuado o pagamento da entrada ou de qualquer parcela, e não compareça ao embarque ou solicite o cancelamento, NÃO haverá reembolso em dinheiro dos valores pagos. Em vez disso, o Contratante receberá os valores pagos como CRÉDITO (saldo) para utilização exclusivamente em serviços da Contratada, com prazo de 90 (noventa) dias para escolher um novo destino.'),
    
    sanitizeTextForPDF('PARÁGRAFO PRIMEIRO - PRAZO DE VALIDADE DO CRÉDITO: O crédito concedido terá validade de 90 (noventa) dias corridos a partir da data do cancelamento para que o Contratante selecione um novo destino. Após este prazo, o crédito será automaticamente perdido, sem direito a qualquer restituição.'),
    
    sanitizeTextForPDF('PARÁGRAFO SEGUNDO - MULTA DE CANCELAMENTO: Será aplicada multa de 20% (vinte por cento) sobre o valor pago. Portanto, o Contratante receberá como crédito apenas 80% (oitenta por cento) do valor que havia pago.'),
    
    sanitizeTextForPDF('PARÁGRAFO TERCEIRO - ISENÇÃO DE MULTA (CANCELAMENTO COM 15 DIAS DE ANTECEDÊNCIA): Caso o Contratante notifique a Contratada sobre o cancelamento com antecedência mínima de 15 (quinze) dias antes da data do embarque, a multa de 20% (vinte por cento) NÃO será aplicada. Neste caso, o Contratante receberá 100% (cem por cento) do valor pago como crédito, válido por 90 (noventa) dias para utilização em serviços da agência.'),
    
    sanitizeTextForPDF('PARÁGRAFO QUARTO - REEMBOLSO POR MOTIVO DE SAÚDE: O reembolso integral em dinheiro somente será concedido nos casos em que o Contratante ou passageiro comprove, mediante apresentação de atestado médico ou hospitalar original, que esteve impossibilitado de viajar por motivo de doença ou problema de saúde. Neste caso, não haverá aplicação de multa e o valor será integralmente reembolsado.'),
    
    sanitizeTextForPDF('PARÁGRAFO QUINTO - REQUISITOS PARA COMPROVAÇÃO MÉDICA: O atestado médico ou hospitalar deverá conter: (a) identificação completa do profissional ou instituição de saúde; (b) data da emissão; (c) CID (Classificação Internacional de Doenças) ou descrição clara da condição de saúde; (d) indicação expressa de que o paciente estava impossibilitado de viajar no período programado. A Contratada reserva-se o direito de solicitar documentação complementar para validação.')
  ];
  
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  cancellationClauses.forEach(clause => {
    // Check for page break before adding clause
    if (currentY > 240) {
      doc.addPage();
      currentY = 20;
    }
    const lines = doc.splitTextToSize(clause, 180);
    doc.text(lines, 15, currentY);
    currentY += lines.length * 4 + 8;
  });
  
  // Check if we need a new page
  if (currentY > 230) {
    doc.addPage();
    currentY = 20;
  }
  
  // DAS CONSIDERAÇÕES FINAIS section with professional background
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0); // Black text
  doc.text('DAS CONSIDERAÇÕES FINAIS', 15, currentY);
  currentY += 15;
  
  doc.setFontSize(10);
  doc.text('Cláusula de n.º 18. O Contratante e a Contratada elegem o foro da comarca de', 15, currentY);
  doc.text('Esmeraldas – MG para dirimir todas as questões oriundas deste contrato.', 15, currentY + 5);
  currentY += 15;
  
  doc.text('Cláusula de n.º 19. E, para a firmeza e como prova de assim haverem acordado e', 15, currentY);
  doc.text('contratado, fizeram as partes este instrumento particular.', 15, currentY + 5);
  currentY += 25;
  
  // Date and location
  doc.text(`Esmeraldas – MG, ${new Date().toLocaleDateString('pt-BR')}`, 15, currentY);
  currentY += 30;
  
  // Signature lines
  doc.setDrawColor(0, 0, 0); // Black lines
  doc.setLineWidth(1);
  doc.line(15, currentY, 85, currentY);
  doc.line(110, currentY, 180, currentY);
  
  doc.setFontSize(9);
  doc.text('Assinatura do Contratante', 15, currentY + 8);
  doc.text('Assinatura da Contratada', 110, currentY + 8);
  
  currentY += 25;
  
  // Witness signatures
  doc.setDrawColor(0, 0, 0); // Black lines
  doc.setLineWidth(1);
  doc.line(15, currentY, 85, currentY);
  doc.line(110, currentY, 180, currentY);
  
  doc.text('Assinatura da Testemunha 1', 15, currentY + 8);
  doc.text('Assinatura da Testemunha 2', 110, currentY + 8);
  
  currentY += 30;
  
  // Insurance option
  doc.setFontSize(10);
  doc.text('Declaro ter sido informado sobre a opção de aquisição de Seguro de Viagem:', 15, currentY);
  currentY += 10;
  doc.text('(  ) Optando pelo Seguro;', 15, currentY);
  currentY += 8;
  doc.text('(  ) Não optando pelo Seguro;', 15, currentY);
  currentY += 15;
  
  doc.text(`Esmeraldas – MG, ${new Date().toLocaleDateString('pt-BR')}`, 15, currentY);
  currentY += 20;
  
  // Final signature lines for insurance
  doc.setDrawColor(0, 0, 0); // Black lines
  doc.setLineWidth(1);
  doc.line(15, currentY, 85, currentY);
  doc.line(110, currentY, 180, currentY);
  
  doc.setFontSize(9);
  doc.text('Assinatura do Contratante', 15, currentY + 8);
  doc.text('Assinatura da Contratada', 110, currentY + 8);
  
  // Add creator information if available
  if (createdBy) {
    currentY += 25;
    
    // Check if we need a new page before adding creator info
    const pageHeight = (doc.internal.pageSize as any).getHeight ? (doc.internal.pageSize as any).getHeight() : doc.internal.pageSize.height;
    if (currentY > pageHeight - 40) {
      doc.addPage();
      currentY = 20;
    }
    
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    const creatorName = createdBy.split('@')[0]; // Extract name from email
    doc.text(`Contrato criado por: ${creatorName}`, 15, currentY);
  }
  
  // Add simple professional footer
  addSimpleFooter(doc);
  
  // Download the PDF
  const filename = `Contrato_${client.first_name}_${client.last_name}_RodaBemTurismo.pdf`;
  doc.save(filename);
}

// ULTRA-PROFESSIONAL footer function with stunning green styling for contracts
function addUltraProfessionalContractFooter(doc: jsPDF): void {
  const pageCount = doc.getNumberOfPages();
  const pageHeight = (doc.internal.pageSize as any).getHeight ? (doc.internal.pageSize as any).getHeight() : doc.internal.pageSize.height;
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Add premium footer background with elegant gradient
    doc.setFillColor(250, 254, 250); // Ultra-light green background
    doc.rect(0, pageHeight - 40, 210, 40, 'F');
    
    // Add sophisticated gradient layers
    doc.setFillColor(248, 252, 248); // Light green gradient
    doc.rect(0, pageHeight - 40, 210, 15, 'F');
    
    doc.setFillColor(240, 248, 242); // Medium green gradient
    doc.rect(0, pageHeight - 40, 210, 8, 'F');
    
    // Add multiple professional accent lines with shadows
    doc.setDrawColor(180, 200, 180); // Shadow line
    doc.setLineWidth(4);
    doc.line(2, pageHeight - 38, 208, pageHeight - 38);
    
    doc.setDrawColor(108, 194, 74); // Main green line
    doc.setLineWidth(3);
    doc.line(0, pageHeight - 40, 210, pageHeight - 40);
    
    doc.setDrawColor(140, 200, 120); // Medium green accent
    doc.setLineWidth(1);
    doc.line(0, pageHeight - 37, 210, pageHeight - 37);
    
    doc.setDrawColor(180, 220, 180); // Light green accent
    doc.setLineWidth(0.5);
    doc.line(0, pageHeight - 35, 210, pageHeight - 35);
    
    // Add premium company logo area with elegant design
    doc.setFillColor(255, 255, 255); // White circle background
    doc.circle(30, pageHeight - 20, 12, 'F');
    
    // Multiple circular borders for logo area
    doc.setDrawColor(108, 194, 74);
    doc.setLineWidth(2);
    doc.circle(30, pageHeight - 20, 12);
    
    doc.setLineWidth(1);
    doc.circle(30, pageHeight - 20, 10);
    
    doc.setLineWidth(0.5);
    doc.circle(30, pageHeight - 20, 8);
    
    // Add company name with premium typography
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0); // Black text
    doc.text('RODA BEM TURISMO', 50, pageHeight - 25);
    
    // Professional contact information with elegant box design
    doc.setFillColor(240, 248, 242); // Light green background
    doc.rect(50, pageHeight - 30, 140, 15, 'F');
    
    // Add sophisticated borders for contact box
    doc.setDrawColor(108, 194, 74);
    doc.setLineWidth(1);
    doc.rect(50, pageHeight - 30, 140, 15);
    
    doc.setDrawColor(180, 220, 180);
    doc.setLineWidth(0.5);
    doc.rect(52, pageHeight - 28, 136, 11);
    
    // Contact details with premium formatting
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0); // Black text
    doc.text('CNPJ: 27.643.750/0019-0 | Tel: (31) 99932-5441', 55, pageHeight - 23);
    doc.text('Email: contato@rodabemturismo.com | www.rodabemturismo.com', 55, pageHeight - 18);
    
    // Ultra-premium page number with elegant styling
    doc.setFillColor(108, 194, 74); // Green background
    doc.rect(165, pageHeight - 25, 35, 12, 'F');
    
    // Add elegant shadow for page number box
    doc.setFillColor(80, 140, 50); // Darker shadow
    doc.rect(167, pageHeight - 23, 35, 12, 'F');
    
    // Main page number box
    doc.setFillColor(108, 194, 74);
    doc.rect(165, pageHeight - 25, 35, 12, 'F');
    
    // Add premium border
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(1);
    doc.rect(165, pageHeight - 25, 35, 12);
    
    // Page number text with white color on green background
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255); // White text
    doc.text(`Página ${i} de ${pageCount}`, 168, pageHeight - 18);
    
    // Add elegant decorative corner elements
    doc.setFillColor(108, 194, 74);
    doc.rect(5, pageHeight - 12, 8, 4, 'F');
    doc.rect(197, pageHeight - 12, 8, 4, 'F');
    
    // Add premium accents in corners
    doc.setFillColor(240, 248, 242);
    doc.rect(7, pageHeight - 10, 4, 2, 'F');
    doc.rect(199, pageHeight - 10, 4, 2, 'F');
    
    // Add elegant border for decorative elements
    doc.setDrawColor(108, 194, 74);
    doc.setLineWidth(0.5);
    doc.rect(5, pageHeight - 12, 8, 4);
    doc.rect(197, pageHeight - 12, 8, 4);
  }
}

export interface FinancialReportData {
  transactions: FinancialTransaction[];
  period: string;
  summary: {
    totalEntradas: number;
    totalSaidas: number;
    saldoFinal: number;
    totalTransactions: number;
  };
}

export async function generateFinancialReport(data: FinancialReportData): Promise<void> {
  const doc = new jsPDF();
  
  // Simple professional header without complex logo
  const startY = addSimpleHeader(
    doc, 
    `Relatório Financeiro - ${data.period}`,
    `Relatório de transações financeiras do período`
  );
  
  // Summary section
  doc.setFontSize(14);
  doc.setTextColor(40, 40, 40);
  doc.text('RESUMO FINANCEIRO', 15, startY + 10);
  
  const summaryData = [
    ['Total de Entradas', `R$ ${data.summary.totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
    ['Total de Saídas', `R$ ${Math.abs(data.summary.totalSaidas).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
    ['Saldo Final', `R$ ${data.summary.saldoFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
    ['Total de Transações', data.summary.totalTransactions.toString()]
  ];
  
  // Manual summary table creation
  let currentY = startY + 20;
  
  // Summary table header
  doc.setFillColor(108, 194, 74);
  doc.rect(15, currentY, 180, 8, 'F');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text('Métrica', 20, currentY + 5);
  doc.text('Valor', 150, currentY + 5);
  currentY += 8;
  
  // Summary table rows
  doc.setTextColor(40, 40, 40);
  summaryData.forEach((row, index) => {
    // Alternate row colors
    if (index % 2 === 0) {
      doc.setFillColor(248, 249, 250);
      doc.rect(15, currentY, 180, 6, 'F');
    }
    
    doc.setFontSize(9);
    doc.text(row[0], 20, currentY + 4);
    doc.text(row[1], 150, currentY + 4);
      currentY += 6;
  });
  
  currentY += 15; // Add space after summary table
  
  // Transactions table
  if (data.transactions.length > 0) {
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text('DETALHAMENTO DAS TRANSAÇÕES', 15, currentY);
    currentY += 10;
    
    const transactionsData = data.transactions.map(transaction => {
      return [
        new Date(transaction.transaction_date).toLocaleDateString('pt-BR'),
        sanitizeTextForPDF(transaction.description || ''),
        transaction.amount >= 0 ? 'Entrada' : 'Saída',
        `R$ ${Math.abs(transaction.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        sanitizeTextForPDF(transaction.category || '-')
      ];
    });
    
    // Manual transactions table creation
    currentY += 15;
    
    // Table header
    doc.setFillColor(108, 194, 74);
    doc.rect(15, currentY, 180, 8, 'F');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text('Data', 18, currentY + 5);
    doc.text('Descrição', 40, currentY + 5);
    doc.text('Tipo', 120, currentY + 5);
    doc.text('Valor', 145, currentY + 5);
    doc.text('Categoria', 175, currentY + 5);
    currentY += 8;
    
    // Table rows
    doc.setTextColor(40, 40, 40);
    transactionsData.forEach((row, index) => {
      // Check if we need a new page
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
        
        // Repeat header on new page
        doc.setFillColor(108, 194, 74);
        doc.rect(15, currentY, 180, 8, 'F');
        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255);
        doc.text('Data', 18, currentY + 5);
        doc.text('Descrição', 40, currentY + 5);
        doc.text('Tipo', 120, currentY + 5);
        doc.text('Valor', 145, currentY + 5);
        doc.text('Categoria', 175, currentY + 5);
        currentY += 8;
        doc.setTextColor(40, 40, 40);
      }
      
      // Alternate row colors
      if (index % 2 === 0) {
        doc.setFillColor(248, 249, 250);
        doc.rect(15, currentY, 180, 6, 'F');
      }
      
      doc.setFontSize(7);
      doc.text(row[0], 18, currentY + 4);
      doc.text(row[1].substring(0, 30), 40, currentY + 4);
      doc.text(row[2], 120, currentY + 4);
      doc.text(row[3], 145, currentY + 4);
      doc.text(row[4], 175, currentY + 4);
      currentY += 6;
    });
  }
  
  // Professional footer
  addProfessionalFooter(doc);
  
  // Download the PDF
  const filename = `Relatorio_Financeiro_${data.period.replace(/[^a-zA-Z0-9]/g, '_')}_RodaBemTurismo.pdf`;
  doc.save(filename);
}

export async function generateBateVoltaContract(client: ClientWithChildren, createdBy?: string): Promise<void> {
  const doc = new jsPDF();
  
  let currentY = 20;
  
  // Fetch destination details if available
  let destinationDetails: any = null;
  try {
    const response = await fetch('/api/destinations/active', {
      cache: 'no-store'
    });
    if (response.ok) {
      const destinations = await response.json();
      destinationDetails = destinations.find((d: any) => d.name === client.destination);
    }
  } catch (error) {
    console.warn('Could not fetch destination details for contract:', error);
  }
  
  // Add white background
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, 210, 297, 'F');
  
  // Header with company logo and info
  await addLogoToPDF(doc, 15, 10, 25, 25);
  
  // Company name and details (right side of logo)
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text('RODA BEM', 50, 20);
  doc.text('TURISMO', 50, 28);
  
  doc.setFontSize(8);
  doc.text('Rua Visconde de Caeté, n.º 44 - Centro - Esmeraldas - MG', 50, 35);
  doc.text('Tel: (0xx31) 3536-7414 - (0xx31) 99932-5441', 80, 40);
  doc.text('CNPJ/ME: 27.643.750/0019-0', 95, 45);
  
  currentY = 65;
  
  // Contract title section
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text('DADOS DA RESERVA', 15, currentY);
  currentY += 8;
  
  // Calculate dates from destination details
  let travelDate = 'A definir';
  let returnDate = 'A definir';
  
  if (destinationDetails?.periodo_viagem_inicio && destinationDetails?.periodo_viagem_fim) {
    const startDate = new Date(destinationDetails.periodo_viagem_inicio);
    const endDate = new Date(destinationDetails.periodo_viagem_fim);
    if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
      travelDate = startDate.toLocaleDateString('pt-BR');
      returnDate = endDate.toLocaleDateString('pt-BR');
    }
  }
  
  // Reservation details
  doc.setFontSize(9);
  doc.text(sanitizeTextForPDF(`Roteiro: ${client.destination || 'Caracóis de Barro-Esmeraldas-MG/FEIRA DO BRÁS- SP'}`), 15, currentY);
  currentY += 6;
  doc.text(`Data de saída: ${travelDate}`, 15, currentY);
  currentY += 6;
  doc.text(`Data de retorno: ${returnDate}`, 15, currentY);
  currentY += 6;
  doc.text(`Hora da apresentação: ${destinationDetails?.embarque || '(...), em Esmeraldas -MG'}`, 15, currentY);
  currentY += 6;
  doc.text(`Local de Embarque: ${destinationDetails?.embarque || 'A definir conforme destino'}`, 15, currentY);
  currentY += 6;
  if (destinationDetails?.retorno) {
    doc.text(`Local de Retorno: ${destinationDetails.retorno}`, 15, currentY);
    currentY += 6;
  }
  currentY += 9;
  
  // Client registration data
  doc.setFontSize(11);
  doc.text('DADOS CADASTRAIS DO(A) RESPONSÁVEL PELO PAGAMENTO', 15, currentY);
  currentY += 8;
  
  const fullName = sanitizeTextForPDF(`${client.first_name || ''} ${client.last_name || ''}`.trim());
  const civStatus = sanitizeTextForPDF(client.civil_status || 'estado civil não informado');
  const cpf = sanitizeTextForPDF(client.cpf || '(...CPF...)');
  const rg = sanitizeTextForPDF(client.rg || '(...RG...)');
  const city = sanitizeTextForPDF(client.city || 'Esmeraldas');
  const address = sanitizeTextForPDF(client.address || '(...endereço...)');
  const state = sanitizeTextForPDF(client.state || 'MG');
  const phone = sanitizeTextForPDF(client.phone || '(...telefone...)');
  
  const clientInfo = `Nome: ${fullName}, brasileiro(a), ${civStatus}, CPF: ${cpf}, RG: ${rg}, residente(a) nesta cidade de ${city}, à ${address}, CEP: (...CEP...), Telefone(s): ${phone}`;
  
  doc.setFontSize(9);
  const clientInfoLines = doc.splitTextToSize(clientInfo, 180);
  doc.text(clientInfoLines, 15, currentY);
  currentY += clientInfoLines.length * 4 + 10;
  
  // Passenger data
  doc.setFontSize(11);
  doc.text('DADOS DO(A) PASSAGEIRO(A):', 15, currentY);
  currentY += 8;
  
  doc.setFontSize(9);
  doc.text(`Nome: ${fullName}`, 15, currentY);
  currentY += 6;
  doc.text(`RG: ${rg}`, 15, currentY);
  currentY += 6;
  doc.text(`CPF: ${cpf}`, 15, currentY);
  currentY += 6;
  
  // Note about payment responsibility
  doc.text('(RESPONSÁVEL PELO PAGAMENTO)', 15, currentY);
  currentY += 15;
  
  // Add acompanhantes section if there are any
  if (client.children && client.children.length > 0) {
    // Check if we need a new page
    if (currentY > 200) {
      doc.addPage();
      currentY = 20;
    }
    
    doc.setFontSize(11);
    doc.text('ACOMPANHANTES:', 15, currentY);
    currentY += 8;
    
    // Relationship labels
    const relationshipLabels: { [key: string]: string } = {
      'filho': 'Filho',
      'filha': 'Filha',
      'pai': 'Pai',
      'mae': 'Mãe',
      'sogro': 'Sogro',
      'sogra': 'Sogra',
      'enteado': 'Enteado',
      'enteada': 'Enteada',
      'neto': 'Neto',
      'neta': 'Neta',
      'cônjuge': 'Cônjuge',
      'outro': 'Outro'
    };
    
    // Prepare table data for acompanhantes
    const acompanhantesData = client.children.map((child) => {
      const childName = sanitizeTextForPDF(child.name || 'Nome não informado');
      const relationship = relationshipLabels[child.relationship] || child.relationship || 'N/A';
      const rgCpf = [];
      if (child.rg) rgCpf.push(`RG: ${child.rg}`);
      if (child.cpf) rgCpf.push(`CPF: ${child.cpf}`);
      const rgCpfText = rgCpf.length > 0 ? rgCpf.join('\n') : 'N/A';
      const phone = sanitizeTextForPDF(child.phone || 'N/A');
      const seatNumber = child.seat_number || 'N/A';
      
      return [childName, relationship, rgCpfText, phone, seatNumber];
    });
    
    // Render acompanhantes table
    autoTable(doc, {
      startY: currentY,
      head: [['Nome', 'Parentesco', 'RG/CPF', 'Telefone', 'Poltrona']],
      body: acompanhantesData,
      theme: 'grid',
      headStyles: {
        fillColor: [108, 194, 74],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
      },
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 30 },
        2: { cellWidth: 40 },
        3: { cellWidth: 35 },
        4: { cellWidth: 25 },
      },
    });
    
    // Update currentY from table final position
    currentY = (doc as any).lastAutoTable.finalY + 10;
  }
  
  // Total value
  doc.setFontSize(11);
  // Calculate total price including children/company members
  const basePrice = client.travel_price || 0;
  const childrenTotal = (client.children || []).reduce((sum, child) => sum + (child.price || 0), 0);
  const totalPrice = basePrice + childrenTotal;
  doc.text(`VALOR TOTAL: R$ ${totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 15, currentY);
  currentY += 8;
  
  const paymentMethodLabels = {
    'avista': 'À VISTA',
    'pix': 'PIX',
    'crediario_agencia': 'CREDIÁRIO DA AGÊNCIA',
    'credito_banco': 'CRÉDITO DO BANCO',
    'boleto': 'BOLETO BANCÁRIO',
    'link': 'LINK'
  };
  
  const paymentMethod = client.payment_method ? paymentMethodLabels[client.payment_method] || 'A definir' : 'A definir';
  doc.text(`FORMA DE PAGAMENTO: ${paymentMethod}`, 15, currentY);
  currentY += 8;
  
  // Add down payment information if available
  if (client.down_payment && client.down_payment > 0) {
    doc.setFontSize(10);
    doc.text(`Entrada: R$ ${client.down_payment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 15, currentY);
    currentY += 6;
  }
  
  // Show installment details for credit and boleto payment methods
  if (client.payment_method && ['crediario_agencia', 'credito_banco', 'boleto', 'link'].includes(client.payment_method)) {
    doc.setFontSize(10);
    
    // Calculate installment details if data is available
    const installmentsCount = client.installments_count || 0;
    const downPayment = client.down_payment || 0;
    const remainingAmount = totalPrice && downPayment ? totalPrice - downPayment : totalPrice;
    
    if (installmentsCount > 0) {
      doc.text(`Número de parcelas: ${installmentsCount}`, 15, currentY);
      currentY += 6;
      
      // Calculate and show installment value
      if (remainingAmount && installmentsCount > 0) {
        const installmentValue = remainingAmount / installmentsCount;
        doc.text(`Valor de cada parcela: R$ ${installmentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 15, currentY);
        currentY += 6;
      }
      
      // Show due dates if available
      if (client.installment_due_date) {
        doc.text(`Vencimento: ${client.installment_due_date}`, 15, currentY);
        currentY += 6;
      }
      
      if (client.first_installment_due_date) {
        doc.text(`Vencimento da primeira parcela: ${client.first_installment_due_date}`, 15, currentY);
        currentY += 6;
      }
    }
  }
  
  currentY += 9;
  
  // Check if we need a new page
  if (currentY > 230) {
    doc.addPage();
    currentY = 20;
  }
  
  // DA AUTORIZAÇÃO PARA USO DE IMAGEM section - VERY CLEAR
  doc.setFillColor(255, 255, 200);
  doc.rect(10, currentY - 5, 190, 12, 'F');
  
  doc.setDrawColor(255, 200, 0);
  doc.setLineWidth(2);
  doc.rect(10, currentY - 5, 190, 12);
  
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('DA AUTORIZAÇÃO PARA USO DE IMAGEM E MARKETING', 15, currentY);
  doc.setFont('helvetica', 'normal');
  currentY += 10;
  
  doc.setFontSize(9);
  const imageAuthClauseBV = sanitizeTextForPDF('AUTORIZAÇÃO PARA USO DE IMAGEM: O CONTRATANTE autoriza expressamente a CONTRATADA a captar fotografias e vídeos durante a viagem e utilizá-los para fins de marketing, publicidade e divulgação nas redes sociais (Facebook, Instagram, TikTok, YouTube e outras), sem qualquer compensação financeira.');
  const imageAuthLinesBV = doc.splitTextToSize(imageAuthClauseBV, 180);
  doc.text(imageAuthLinesBV, 15, currentY);
  currentY += imageAuthLinesBV.length * 4 + 12;
  
  // Check if we need a new page
  if (currentY > 230) {
    doc.addPage();
    currentY = 20;
  }
  
  // Legal clauses - POLÍTICA DE CANCELAMENTO
  doc.setFillColor(255, 230, 230);
  doc.rect(10, currentY - 5, 190, 12, 'F');
  
  doc.setDrawColor(220, 53, 69);
  doc.setLineWidth(2);
  doc.rect(10, currentY - 5, 190, 12);
  
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('POLÍTICA DE CANCELAMENTO E DESISTÊNCIA', 15, currentY);
  doc.setFont('helvetica', 'normal');
  currentY += 10;
  
  const clause1 = sanitizeTextForPDF('POLÍTICA DE CANCELAMENTO E CRÉDITO: Caso o CONTRATANTE cancele a viagem após ter efetuado o pagamento da entrada ou de qualquer parcela, e não compareça ao embarque ou solicite o cancelamento, NÃO haverá reembolso em dinheiro. O CONTRATANTE receberá os valores pagos como CRÉDITO (saldo) para utilização exclusivamente em serviços da CONTRATADA, com prazo de 90 (noventa) dias para escolher um novo destino.');
  const clause1Lines = doc.splitTextToSize(clause1, 180);
  doc.setFontSize(9);
  doc.text(clause1Lines, 15, currentY);
  currentY += clause1Lines.length * 4 + 8;
  
  const clause2 = sanitizeTextForPDF('MULTA DE CANCELAMENTO: Será aplicada multa de 20% (vinte por cento) sobre o valor pago. O CONTRATANTE receberá como crédito apenas 80% (oitenta por cento) do valor pago. EXCEÇÃO: Se o cancelamento for notificado com 15 (quinze) dias de antecedência, NÃO haverá multa e o CONTRATANTE receberá 100% do valor como crédito válido por 90 dias.');
  const clause2Lines = doc.splitTextToSize(clause2, 180);
  doc.text(clause2Lines, 15, currentY);
  currentY += clause2Lines.length * 4 + 8;
  
  const clause4 = sanitizeTextForPDF('REEMBOLSO POR MOTIVO DE SAÚDE: O reembolso integral em dinheiro somente será concedido mediante apresentação de atestado médico ou hospitalar original comprovando impossibilidade de viajar. O atestado deve conter: identificação do profissional/instituição, data, CID ou descrição da condição, e indicação de impossibilidade de viajar. Neste caso, não haverá multa.');
  const clause4Lines = doc.splitTextToSize(clause4, 180);
  doc.text(clause4Lines, 15, currentY);
  currentY += clause4Lines.length * 4 + 8;
  
  // Check if we need a new page
  if (currentY > 230) {
    doc.addPage();
    currentY = 20;
  }
  
  // Cancellation clause
  doc.setFontSize(10);
  doc.text('DA RESCISÃO:', 15, currentY);
  currentY += 8;
  
  const rescisionClause = sanitizeTextForPDF('É permitida a qualquer das partes, o direito de rescindir o presente contrato, desde que o faça por escrito, ressalvada a parte prejudicada, em querendo, pleitear eventual prejuízo não derivado de caso fortuito ou força maior, cumulativamente a multa compensatória de vinte por cento (20%) sobre o valor total do pacote – artigo 740, do Código Civil.');
  const rescisionLines = doc.splitTextToSize(rescisionClause, 180);
  doc.setFontSize(9);
  doc.text(rescisionLines, 15, currentY);
  currentY += rescisionLines.length * 4 + 10;
  
  // Jurisdiction clause
  doc.setFontSize(10);
  doc.text('DO FORO:', 15, currentY);
  currentY += 8;
  
  const foroClause = sanitizeTextForPDF('As partes elegem o foro da comarca de Esmeraldas para dirimir toda e qualquer controvérsia, renunciando a qualquer outro por mais privilegiado que o seja.');
  const foroLines = doc.splitTextToSize(foroClause, 180);
  doc.setFontSize(9);
  doc.text(foroLines, 15, currentY);
  currentY += foroLines.length * 4 + 15;
  
  // Contract conclusion
  const conclusionClause = sanitizeTextForPDF('E, por estarem justas e contratadas, as partes, CONTRATANTE(S) e CONTRATADA, após detida leitura, não havendo qualquer divergência, aceitam-no e assinam-no, em duas (02) vias, de igual teor e para um só fim.');
  const conclusionLines = doc.splitTextToSize(conclusionClause, 180);
  doc.text(conclusionLines, 15, currentY);
  currentY += conclusionLines.length * 4 + 15;
  
  // Date and location
  doc.text(`Esmeraldas, ........... de ........................... de ...............`, 15, currentY);
  currentY += 20;
  
  // Signature fields
  doc.text('ATENDENTE:', 15, currentY);
  currentY += 15;
  doc.text('CONTRATANTE(S)', 15, currentY);
  currentY += 15;
  doc.text('CONTRATADA', 15, currentY);
  
  // Add creator information if available
  if (createdBy) {
    currentY += 20;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    const creatorName = createdBy.split('@')[0]; // Extract name from email
    doc.text(`Contrato criado por: ${creatorName}`, 15, currentY);
  }
  
  // Add simple footer
  addSimpleFooter(doc);
  
  // Download the PDF
  const sanitizedFirstName = sanitizeTextForPDF(client.first_name || 'Cliente');
  const sanitizedLastName = sanitizeTextForPDF(client.last_name || '');
  const filename = `Contrato_BateVolta_${sanitizedFirstName}_${sanitizedLastName}_RodaBemTurismo.pdf`;
  doc.save(filename);
}

// Generate Passenger Manifest PDF
export async function generatePassengerManifest(
  destination: any,
  bus: any,
  reservations: any[]
): Promise<void> {
  const doc = new jsPDF();
  
  // Add logo
  await addLogoToPDF(doc, 15, 10, 40, 20);
  
  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('MANIFESTO DE PASSAGEIROS', 105, 45, { align: 'center' });
  
  // Destination and bus info
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Destino: ${destination.name} (${destination.country})`, 15, 60);
  doc.text(`Ônibus: ${bus.name} - ${bus.type}`, 15, 70);
  doc.text(`Total de assentos: ${bus.total_seats}`, 15, 80);
  doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 15, 90);
  
  // Statistics
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Assentos ocupados: ${reservations.length}`, 15, 100);
  doc.text(`Assentos disponíveis: ${bus.total_seats - reservations.length}`, 15, 108);
  
  // Reset color
  doc.setTextColor(0, 0, 0);
  
  // Table of passengers
  if (reservations.length > 0) {
    const tableData = reservations
      .sort((a, b) => {
        // Handle non-numeric seat numbers by comparing as strings
        const aNum = parseInt(a.seat_number);
        const bNum = parseInt(b.seat_number);
        
        // If both are numeric, compare numerically
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return aNum - bNum;
        }
        
        // Otherwise, compare as strings
        return String(a.seat_number || '').localeCompare(String(b.seat_number || ''));
      })
      .map((reservation, index) => [
        (index + 1).toString(),
        reservation.seat_number || 'N/A',
        reservation.client_name || 'Nome não informado',
        reservation.status === 'confirmed' ? 'Confirmado' : 'Reservado'
      ]);
    
    autoTable(doc, {
      startY: 118,
      head: [['#', 'Assento', 'Nome do Passageiro', 'Status']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [108, 194, 74],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 10,
        cellPadding: 5,
      },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 30 },
        2: { cellWidth: 90 },
        3: { cellWidth: 40 },
      },
    });
  } else {
    doc.setFontSize(12);
    doc.setTextColor(150, 150, 150);
    doc.text('Nenhum passageiro registrado ainda.', 105, 130, { align: 'center' });
  }
  
  // Footer
  addSimpleFooter(doc);
  
  // Download
  const sanitizedDestination = sanitizeTextForPDF(destination.name);
  const sanitizedBus = sanitizeTextForPDF(bus.name);
  const filename = `Manifesto_Passageiros_${sanitizedDestination}_${sanitizedBus}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}

// Generate Embarque PDF (Boarding PDF) - seat number, CPF, full name, RG
export async function generateEmbarquePDF(
  destination: any,
  bus: any,
  passengers: Array<any>
): Promise<void> {
  const doc = new jsPDF();
  
  // Add logo
  await addLogoToPDF(doc, 15, 10, 40, 20);
  
  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('LISTA DE EMBARQUE', 105, 45, { align: 'center' });
  
  // Destination and bus info
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Destino: ${destination.name} (${destination.country})`, 15, 60);
  doc.text(`Ônibus: ${bus.name} - ${bus.type}`, 15, 70);
  doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 15, 80);
  
  let yPosition = 90;
  
  // Display new fields if they exist
  if (destination.guias) {
    doc.text(`Guias: ${destination.guias}`, 15, yPosition);
    yPosition += 10;
  }
  
  if (destination.o_motorista) {
    doc.text(`O Motorista: ${destination.o_motorista}`, 15, yPosition);
    yPosition += 10;
  }
  
  if (destination.nome_empresa_onibus) {
    doc.text(`Nome da Empresa de Ônibus: ${destination.nome_empresa_onibus}`, 15, yPosition);
    yPosition += 10;
  }
  
  // Reset color
  doc.setTextColor(0, 0, 0);
  
  // Table of passengers for boarding
  if (passengers.length > 0) {
    const tableData = passengers
      .sort((a, b) => {
        // Sort alphabetically by client name
        const nameA = sanitizeTextForPDF(a.client_name || '').toUpperCase();
        const nameB = sanitizeTextForPDF(b.client_name || '').toUpperCase();
        return nameA.localeCompare(nameB, 'pt-BR');
      })
      .map((passenger, index) => {
        const getCpf = () => {
          if (passenger.is_child && passenger.child_data) {
            return passenger.child_data.cpf || 'N/A';
          }
          return passenger.client?.cpf || 'N/A';
        };
        
        const getRg = () => {
          if (passenger.is_child && passenger.child_data) {
            return passenger.child_data.rg || 'N/A';
          }
          return passenger.client?.rg || 'N/A';
        };

        const rgCpf = [];
        const rg = getRg();
        const cpf = getCpf();
        if (rg !== 'N/A') rgCpf.push(`RG: ${rg}`);
        if (cpf !== 'N/A') rgCpf.push(`CPF: ${cpf}`);
        const rgCpfText = rgCpf.length > 0 ? rgCpf.join('\n') : 'N/A';
        
        return [
          (index + 1).toString(),
          sanitizeTextForPDF(passenger.client_name || 'Nome não informado'),
          rgCpfText,
          passenger.seat_number || 'S/N',
          passenger.client?.departure_location || 'N/A',
        ];
      });
    
    autoTable(doc, {
      startY: yPosition + 5,
      head: [['N°', 'NOME', 'RG/CPF', 'POLT.', 'EMBARQUE']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [108, 194, 74],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 9,
        cellPadding: 4,
      },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 55 },
        2: { cellWidth: 45 },
        3: { cellWidth: 20 },
        4: { cellWidth: 45 },
      },
    });
  } else {
    doc.setFontSize(12);
    doc.setTextColor(150, 150, 150);
    doc.text('Nenhum passageiro registrado ainda.', 105, yPosition + 20, { align: 'center' });
  }
  
  // Footer
  addSimpleFooter(doc);
  
  // Download
  const sanitizedDestination = sanitizeTextForPDF(destination.name);
  const sanitizedBus = sanitizeTextForPDF(bus.name);
  const filename = `Embarque_${sanitizedDestination}_${sanitizedBus}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}

// Generate Lista Completa PDF (Complete List PDF) - includes phone numbers
export async function generateListaCompletaPDF(
  destination: any,
  bus: any,
  passengers: Array<any>
): Promise<void> {
  const doc = new jsPDF();
  
  // Add logo
  await addLogoToPDF(doc, 15, 10, 40, 20);
  
  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('LISTA COMPLETA DE PASSAGEIROS', 105, 45, { align: 'center' });
  
  // Destination and bus info
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Destino: ${destination.name} (${destination.country})`, 15, 60);
  doc.text(`Ônibus: ${bus.name} - ${bus.type}`, 15, 70);
  doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 15, 80);
  
  let yPosition = 90;
  
  // Display new fields if they exist
  if (destination.guias) {
    doc.text(`Guias: ${destination.guias}`, 15, yPosition);
    yPosition += 10;
  }
  
  if (destination.o_motorista) {
    doc.text(`O Motorista: ${destination.o_motorista}`, 15, yPosition);
    yPosition += 10;
  }
  
  if (destination.nome_empresa_onibus) {
    doc.text(`Nome da Empresa de Ônibus: ${destination.nome_empresa_onibus}`, 15, yPosition);
    yPosition += 10;
  }
  
  // Reset color
  doc.setTextColor(0, 0, 0);
  
  // Table of passengers with phone numbers
  if (passengers.length > 0) {
    const tableData = passengers
      .sort((a, b) => {
        // Sort alphabetically by client name
        const nameA = sanitizeTextForPDF(a.client_name || '').toUpperCase();
        const nameB = sanitizeTextForPDF(b.client_name || '').toUpperCase();
        return nameA.localeCompare(nameB, 'pt-BR');
      })
      .map((passenger, index) => {
        const getCpf = () => {
          if (passenger.is_child && passenger.child_data) {
            return passenger.child_data.cpf || 'N/A';
          }
          return passenger.client?.cpf || 'N/A';
        };
        
        const getRg = () => {
          if (passenger.is_child && passenger.child_data) {
            return passenger.child_data.rg || 'N/A';
          }
          return passenger.client?.rg || 'N/A';
        };

        const rgCpf = [];
        const rg = getRg();
        const cpf = getCpf();
        if (rg !== 'N/A') rgCpf.push(`RG: ${rg}`);
        if (cpf !== 'N/A') rgCpf.push(`CPF: ${cpf}`);
        const rgCpfText = rgCpf.length > 0 ? rgCpf.join('\n') : 'N/A';
        
        const phone = passenger.client?.phone || 'N/A';
        
        return [
          (index + 1).toString(),
          sanitizeTextForPDF(passenger.client_name || 'Nome não informado'),
          rgCpfText,
          phone,
          passenger.seat_number || 'S/N',
          passenger.client?.departure_location || 'N/A',
        ];
      });
    
    autoTable(doc, {
      startY: yPosition + 5,
      head: [['N°', 'NOME', 'RG/CPF', 'TELEFONE', 'POLT.', 'EMBARQUE']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [108, 194, 74],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      columnStyles: {
        0: { cellWidth: 12 },
        1: { cellWidth: 50 },
        2: { cellWidth: 38 },
        3: { cellWidth: 30 },
        4: { cellWidth: 18 },
        5: { cellWidth: 32 },
      },
    });
  } else {
    doc.setFontSize(12);
    doc.setTextColor(150, 150, 150);
    doc.text('Nenhum passageiro registrado ainda.', 105, yPosition + 20, { align: 'center' });
  }
  
  // Footer
  addSimpleFooter(doc);
  
  // Download
  const sanitizedDestination = sanitizeTextForPDF(destination.name);
  const sanitizedBus = sanitizeTextForPDF(bus.name);
  const filename = `Lista_Completa_${sanitizedDestination}_${sanitizedBus}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}

// Generate Motorista PDF (Driver PDF) - Full Name, CPF, RG
export async function generateMotoristaPDF(
  destination: any,
  bus: any,
  passengers: Array<any>
): Promise<void> {
  const doc = new jsPDF();
  
  // Add logo
  await addLogoToPDF(doc, 15, 10, 40, 20);
  
  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('LISTA DO MOTORISTA', 105, 45, { align: 'center' });
  
  // Destination and bus info
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Destino: ${destination.name} (${destination.country})`, 15, 60);
  doc.text(`Ônibus: ${bus.name} - ${bus.type}`, 15, 70);
  doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 15, 80);
  
  // Statistics
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Total de passageiros: ${passengers.length}`, 15, 90);
  
  // Reset color
  doc.setTextColor(0, 0, 0);
  
  // Table of passengers for driver
  if (passengers.length > 0) {
    const tableData = passengers
      .sort((a, b) => sanitizeTextForPDF(a.client_name || '').localeCompare(sanitizeTextForPDF(b.client_name || '')))
      .map((passenger, index) => {
        const getCpf = () => {
          if (passenger.is_child && passenger.child_data) {
            return passenger.child_data.cpf || 'N/A';
          }
          return passenger.client?.cpf || 'N/A';
        };
        
        const getRg = () => {
          if (passenger.is_child && passenger.child_data) {
            return passenger.child_data.rg || 'N/A';
          }
          return passenger.client?.rg || 'N/A';
        };

        return [
          (index + 1).toString(),
          sanitizeTextForPDF(passenger.client_name || 'Nome não informado'),
          getCpf(),
          getRg(),
        ];
      });
    
    autoTable(doc, {
      startY: 100,
      head: [['#', 'Nome Completo', 'CPF', 'RG']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [108, 194, 74],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 9,
        cellPadding: 4,
      },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 75 },
        2: { cellWidth: 50 },
        3: { cellWidth: 40 },
      },
    });
  } else {
    doc.setFontSize(12);
    doc.setTextColor(150, 150, 150);
    doc.text('Nenhum passageiro registrado ainda.', 105, 110, { align: 'center' });
  }
  
  // Footer
  addSimpleFooter(doc);
  
  // Download
  const sanitizedDestination = sanitizeTextForPDF(destination.name);
  const sanitizedBus = sanitizeTextForPDF(bus.name);
  const filename = `Motorista_${sanitizedDestination}_${sanitizedBus}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}

// Generate Hotel PDF - Full Name, CPF, RG, Birth date
export async function generateHotelPDF(
  destination: any,
  bus: any,
  passengers: Array<any>
): Promise<void> {
  const doc = new jsPDF();
  
  // Add logo
  await addLogoToPDF(doc, 15, 10, 40, 20);
  
  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('LISTA PARA HOTEL', 105, 45, { align: 'center' });
  
  // Destination and bus info
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Destino: ${destination.name} (${destination.country})`, 15, 60);
  doc.text(`Ônibus: ${bus.name} - ${bus.type}`, 15, 70);
  doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 15, 80);
  
  // Statistics
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Total de hóspedes: ${passengers.length}`, 15, 90);
  
  // Reset color
  doc.setTextColor(0, 0, 0);
  
  // Table of passengers for hotel - grouped by family
  if (passengers.length > 0) {
    console.log('[HOTEL PDF] Total passengers:', passengers.length);
    console.log('[HOTEL PDF] Sample passenger:', passengers[0]);
    
    const familyGroups = new Map<string, any[]>();
    
    passengers.forEach((passenger) => {
      // Use parent_client_id for grouping (handles both old and new data)
      const groupingId = passenger.parent_client_id || passenger.client_id;
      if (!familyGroups.has(groupingId)) {
        familyGroups.set(groupingId, []);
      }
      familyGroups.get(groupingId)?.push(passenger);
    });
    
    // SPECIAL OVERRIDE: Monte Verde 12/12 - Room overrides
    const destNameNoSpaces = (destination.name || '').toLowerCase().replace(/\s+/g, '');
    if (destNameNoSpaces.includes('monteverde') && destNameNoSpaces.includes('12/12')) {
      console.log('[HOTEL PDF] Applying Monte Verde 12/12 room overrides...');
      
      const entries = Array.from(familyGroups.entries());
      
      // OVERRIDE 1: CELSO CAMPOLINA LEROY + LUCINEIA MARCIA CAMPOLINA = CASAL
      let celsoGroupKey: string | null = null;
      let lucineiaGroupKey: string | null = null;
      
      for (const [key, members] of entries) {
        for (const member of members) {
          const name = (member.client_name || '').toUpperCase();
          if (name.includes('CELSO') && name.includes('CAMPOLINA') && name.includes('LEROY')) {
            celsoGroupKey = key;
            console.log('[HOTEL PDF] Found CELSO CAMPOLINA LEROY in group:', key);
          }
          if (name.includes('LUCINEIA') && name.includes('CAMPOLINA')) {
            lucineiaGroupKey = key;
            console.log('[HOTEL PDF] Found LUCINEIA MARCIA CAMPOLINA in group:', key);
          }
        }
      }
      
      // Merge LUCINEIA into CELSO's group as spouse
      if (celsoGroupKey && lucineiaGroupKey && celsoGroupKey !== lucineiaGroupKey) {
        const lucineiaMembers = familyGroups.get(lucineiaGroupKey) || [];
        const celsoMembers = familyGroups.get(celsoGroupKey) || [];
        
        // Mark LUCINEIA as spouse for CASAL room type
        const lucineiaMembersAsSpouse = lucineiaMembers.map(member => ({
          ...member,
          is_child: true,
          child_data: {
            ...member.child_data,
            relationship: 'cônjuge',
            cpf: member.client?.cpf || member.child_data?.cpf,
            rg: member.client?.rg || member.child_data?.rg,
            birthdate: member.client?.birthdate || member.child_data?.birthdate,
          }
        }));
        
        familyGroups.set(celsoGroupKey, [...celsoMembers, ...lucineiaMembersAsSpouse]);
        familyGroups.delete(lucineiaGroupKey);
        console.log('[HOTEL PDF] Merged LUCINEIA into CELSO group as CASAL');
      }
      
      // OVERRIDE 2: Add Alice Rezende Oliveira Paiva to Daniel Paiva + Rosimeire Rezende = CASAL + CHD
      let danielGroupKey: string | null = null;
      
      for (const [key, members] of entries) {
        for (const member of members) {
          const name = (member.client_name || '').toUpperCase();
          if (name.includes('DANIEL') && name.includes('PAIVA')) {
            danielGroupKey = key;
            console.log('[HOTEL PDF] Found DANIEL PAIVA in group:', key);
          }
        }
      }
      
      // Add Alice as a virtual child to Daniel's group
      if (danielGroupKey) {
        const danielMembers = familyGroups.get(danielGroupKey) || [];
        // Check if Alice is not already in the group
        const aliceExists = danielMembers.some(m => 
          (m.client_name || '').toUpperCase().includes('ALICE') && 
          (m.client_name || '').toUpperCase().includes('REZENDE')
        );
        
        if (!aliceExists) {
          const aliceChild = {
            client_name: 'Alice Rezende Oliveira Paiva',
            is_child: true,
            _isOverrideChild: true,
            child_data: {
              relationship: 'filho(a)',
              name: 'Alice Rezende Oliveira Paiva',
              birthdate: '2021-09-21',
              cpf: 'N/A',
              rg: 'N/A',
            },
            client: null,
            client_id: danielGroupKey,
          };
          
          familyGroups.set(danielGroupKey, [...danielMembers, aliceChild]);
          console.log('[HOTEL PDF] Added Alice Rezende Oliveira Paiva to Daniel/Rosimeire group as CASAL + CHD');
        }
      }
      
      // OVERRIDE 3: ISIS CAMPOLINA COUTINHO joins JULIENE/MAGNA as CHD
      // Re-fetch entries after previous overrides
      const entriesUpdated = Array.from(familyGroups.entries());
      let isisGroupKey: string | null = null;
      let julieneGroupKey: string | null = null;
      
      for (const [key, members] of entriesUpdated) {
        for (const member of members) {
          const name = (member.client_name || '').toUpperCase();
          if (name.includes('ISIS') && name.includes('CAMPOLINA') && name.includes('COUTINHO')) {
            isisGroupKey = key;
            console.log('[HOTEL PDF] Found ISIS CAMPOLINA COUTINHO in group:', key);
          }
          if (name.includes('JULIENE') && name.includes('GOMES')) {
            julieneGroupKey = key;
            console.log('[HOTEL PDF] Found JULIENE GOMES in group:', key);
          }
        }
      }
      
      // Merge ISIS into JULIENE/MAGNA's group as child
      if (isisGroupKey && julieneGroupKey && isisGroupKey !== julieneGroupKey) {
        const isisMembers = familyGroups.get(isisGroupKey) || [];
        const julieneMembers = familyGroups.get(julieneGroupKey) || [];
        
        const isisMembersAsChildren = isisMembers.map(member => ({
          ...member,
          _isOverrideChild: true,
          child_data: {
            ...member.child_data,
            relationship: 'filho(a)',
            cpf: member.client?.cpf || member.child_data?.cpf,
            rg: member.client?.rg || member.child_data?.rg,
            birthdate: member.client?.birthdate || member.child_data?.birthdate,
          }
        }));
        
        familyGroups.set(julieneGroupKey, [...julieneMembers, ...isisMembersAsChildren]);
        familyGroups.delete(isisGroupKey);
        console.log('[HOTEL PDF] Merged ISIS into JULIENE/MAGNA group as CASAL + CHD');
      }
      
      // OVERRIDE 4: Add Mirtes/Jordana/Sebastião group override
      let mirtesGroupKey: string | null = null;
      const entriesFinal = Array.from(familyGroups.entries());
      
      for (const [key, members] of entriesFinal) {
        for (const member of members) {
          const name = (member.client_name || '').toUpperCase();
          if (name.includes('MIRTES') && name.includes('EMILIANO')) {
            mirtesGroupKey = key;
            console.log('[HOTEL PDF] Found MIRTES group:', key);
          }
        }
      }
      
      // Store custom room type labels for Monte Verde 12/12
      const customRoomTypes = new Map<string, string>();
      
      // Daniel/Rosimeire/Alice = "Casal + CHD (4anos)"
      if (danielGroupKey) {
        customRoomTypes.set(danielGroupKey, 'Casal + CHD (4anos)');
        console.log('[HOTEL PDF] Custom room type for Daniel group: Casal + CHD (4anos)');
      }
      
      // Juliene/Magna/ISIS = "Dupla + CHD (6 Anos)"
      if (julieneGroupKey) {
        customRoomTypes.set(julieneGroupKey, 'Dupla + CHD (6 Anos)');
        console.log('[HOTEL PDF] Custom room type for Juliene group: Dupla + CHD (6 Anos)');
      }
      
      // Mirtes/Jordana/Sebastião = "Casal + Solteiro"
      if (mirtesGroupKey) {
        customRoomTypes.set(mirtesGroupKey, 'Casal + Solteiro');
        console.log('[HOTEL PDF] Custom room type for Mirtes group: Casal + Solteiro');
      }
      
      // Store customRoomTypes in a closure variable accessible later
      (familyGroups as any)._customRoomTypes = customRoomTypes;
    }
    
    console.log('[HOTEL PDF] Number of families:', familyGroups.size);
    
    // Get custom room types if available
    const customRoomTypes = (familyGroups as any)._customRoomTypes as Map<string, string> | undefined;
    
    // Store families with their keys for custom room type lookup
    const sortedFamiliesWithKeys = Array.from(familyGroups.entries()).sort((a, b) => {
      const parent_a = a[1].find((p: any) => !p.is_child) || a[1][0];
      const parent_b = b[1].find((p: any) => !p.is_child) || b[1][0];
      const nameA = sanitizeTextForPDF(parent_a.client_name || '').toUpperCase();
      const nameB = sanitizeTextForPDF(parent_b.client_name || '').toUpperCase();
      return nameA.localeCompare(nameB, 'pt-BR');
    });
    
    const sortedFamilies = sortedFamiliesWithKeys.map(([key, members]) => ({
      key,
      members
    }));
    
    const highlightColors = [
      [144, 238, 144],  // Light green
      [255, 255, 102],  // Bright yellow
      [255, 102, 255],  // Bright magenta/pink
      [102, 204, 255],  // Bright cyan/blue
      [255, 178, 102],  // Bright orange
      [204, 153, 255],  // Bright purple
      [255, 204, 102],  // Golden yellow
      [102, 255, 178],  // Bright mint green
      [255, 153, 204],  // Bright pink
      [153, 204, 255],  // Sky blue
    ];
    
    const tableData: any[] = [];
    let rowIndex = 0;
    
    sortedFamilies.forEach(({ key: familyKey, members: family }, familyIndex) => {
      family.sort((a, b) => {
        if (!a.is_child && b.is_child) return -1;
        if (a.is_child && !b.is_child) return 1;
        return 0;
      });
      
      // Check if there's a spouse in this family for debug
      const hasSpouseDebug = family.some((m: any) => m.is_child && m.child_data?.relationship === 'cônjuge');
      console.log(`[HOTEL PDF] Family ${familyIndex + 1} has ${family.length} members, hasSpouse: ${hasSpouseDebug}`);
      if (family.length > 1) {
        family.forEach((m: any, idx: number) => {
          console.log(`  [HOTEL PDF] Member ${idx + 1}: ${m.client_name}, is_child: ${m.is_child}, relationship: ${m.child_data?.relationship || 'N/A'}`);
        });
      }
      
      // Only apply color if family has more than 1 member
      const shouldApplyColor = family.length > 1;
      
      // Determine room type (APTOS) based on family size and composition
      const getRoomType = (familySize: number, familyMembers: any[]): string => {
        // Check if there's a married couple (has spouse relationship)
        const hasSpouse = familyMembers.some((m: any) => 
          m.is_child && m.child_data?.relationship === 'cônjuge'
        );
        // Check if there are children (filho/filha) OR override children
        const hasChildren = familyMembers.some((m: any) => 
          m._isOverrideChild || (m.is_child && (m.child_data?.relationship === 'filho(a)' || m.child_data?.relationship === 'filho' || m.child_data?.relationship === 'filha'))
        );
        
        if (familySize === 1) return 'SINGLE';
        if (familySize === 2) {
          if (hasSpouse) return 'CASAL';
          return 'DUPLO SOLTEIRO';
        }
        if (familySize === 3) {
          if (hasSpouse && hasChildren) return 'CASAL + CHD';
          if (hasSpouse) return 'TRIPLO CASAL';
          return 'TRIPLO SOLTEIRO';
        }
        if (familySize === 4) {
          if (hasSpouse && hasChildren) return 'CASAL + 2CHD';
          if (hasSpouse) return 'QUADRUPLO CASAL';
          return 'QUADRUPLO SOLTEIRO';
        }
        if (familySize >= 5) {
          const childCount = familyMembers.filter((m: any) => 
            m._isOverrideChild || (m.is_child && (m.child_data?.relationship === 'filho(a)' || m.child_data?.relationship === 'filho' || m.child_data?.relationship === 'filha'))
          ).length;
          if (hasSpouse && childCount > 0) return `CASAL + ${childCount}CHD`;
          return `${familySize}x PESSOAS`;
        }
        return 'SINGLE';
      };
      
      // Check for custom room type override first
      const customRoomType = customRoomTypes?.get(familyKey);
      const roomType = customRoomType || getRoomType(family.length, family);
      
      if (customRoomType) {
        console.log(`[HOTEL PDF] Using custom room type for family: ${customRoomType}`);
      }
      
      family.forEach((passenger, memberIndex) => {
        const getBirthdate = () => {
          if (passenger.is_child && passenger.child_data) {
            return passenger.child_data.birthdate 
              ? new Date(passenger.child_data.birthdate).toLocaleDateString('pt-BR')
              : 'N/A';
          }
          return passenger.client?.birthdate 
            ? new Date(passenger.client.birthdate).toLocaleDateString('pt-BR')
            : 'N/A';
        };
        
        const getCpf = () => {
          if (passenger.is_child && passenger.child_data) {
            return passenger.child_data.cpf || 'N/A';
          }
          return passenger.client?.cpf || 'N/A';
        };
        
        const getRg = () => {
          if (passenger.is_child && passenger.child_data) {
            return passenger.child_data.rg || 'N/A';
          }
          return passenger.client?.rg || 'N/A';
        };
        
        tableData.push({
          row: [
            (rowIndex + 1).toString(),
            sanitizeTextForPDF(passenger.client_name || 'Nome não informado'),
            getCpf(),
            getRg(),
            getBirthdate(),
            memberIndex === 0 ? roomType : '', // Only show room type on first member of family
          ],
          color: shouldApplyColor ? highlightColors[familyIndex % highlightColors.length] : null
        });
        rowIndex++;
      });
    });
    
    console.log('[HOTEL PDF] Total rows in table:', tableData.length);
    
    autoTable(doc, {
      startY: 100,
      head: [['#', 'Nome Completo', 'CPF', 'RG', 'Nasc.', 'APTOS']],
      body: tableData.map(item => item.row),
      theme: 'plain',
      headStyles: {
        fillColor: [108, 194, 74],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        lineWidth: 0.1,
        lineColor: [200, 200, 200],
      },
      styles: {
        fontSize: 7,
        cellPadding: 2,
        lineWidth: 0.1,
        lineColor: [200, 200, 200],
      },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 52 },
        2: { cellWidth: 32 },
        3: { cellWidth: 28 },
        4: { cellWidth: 22 },
        5: { cellWidth: 36 },
      },
      didParseCell: (data: any) => {
        if (data.section === 'body') {
          const rowData = tableData[data.row.index];
          if (rowData && rowData.color) {
            data.cell.styles.fillColor = rowData.color;
          }
        }
      },
    });
  } else {
    doc.setFontSize(12);
    doc.setTextColor(150, 150, 150);
    doc.text('Nenhum passageiro registrado ainda.', 105, 110, { align: 'center' });
  }
  
  // Footer
  addSimpleFooter(doc);
  
  // Download
  const sanitizedDestination = sanitizeTextForPDF(destination.name);
  const sanitizedBus = sanitizeTextForPDF(bus.name);
  const filename = `Hotel_${sanitizedDestination}_${sanitizedBus}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}

// Generate Receipt PDF with company logo and professional design
export async function generateReceiptPDF(receipt: Receipt): Promise<void> {
  try {
    // Use the receipt name field directly
    let clientName = receipt.name || 'Cliente';

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let currentY = 15;

    // Company Logo - Green circle with R (matching brand identity)
    const logoX = pageWidth / 2;
    const logoY = currentY + 12;
    const logoRadius = 10;
    
    // Outer circle
    doc.setDrawColor(108, 194, 74); // #6CC24A brand green
    doc.setLineWidth(1.5);
    doc.circle(logoX, logoY, logoRadius, 'S');
    
    // Inner badge circle
    doc.setFillColor(108, 194, 74);
    doc.circle(logoX, logoY, 4, 'F');
    
    // Letter R in white
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    doc.text('R', logoX, logoY + 2, { align: 'center' });
    
    currentY += 30;

    // Company Name - Bold and prominent
    doc.setTextColor(108, 194, 74); // Brand green
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('RODA BEM TURISMO', pageWidth / 2, currentY, { align: 'center' });
    
    currentY += 6;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('sua melhor companhia', pageWidth / 2, currentY, { align: 'center' });
    
    currentY += 8;
    
    // Decorative line
    doc.setDrawColor(108, 194, 74);
    doc.setLineWidth(0.5);
    doc.line(pageWidth / 2 - 30, currentY, pageWidth / 2 + 30, currentY);
    
    currentY += 8;

    // Company details in smaller text
    doc.setFontSize(7);
    doc.setTextColor(80, 80, 80);
    doc.text('DANIEL DE PAIVA REZENDE OLIVEIRA', pageWidth / 2, currentY, { align: 'center' });
    currentY += 4;
    doc.text('CNPJ: 27.643.735/0001-90', pageWidth / 2, currentY, { align: 'center' });
    currentY += 4;
    doc.text('Rua Visconde de Caete, 44 - Centro - Esmeraldas/MG - CEP 32.800-070', pageWidth / 2, currentY, { align: 'center' });
    currentY += 4;
    doc.text('Tel.: (31) 99932-5441 | E-mail: contato@rodabemturismo.com', pageWidth / 2, currentY, { align: 'center' });
    
    currentY += 12;

    // RECIBO Title Box - Clean design with green accent
    doc.setFillColor(108, 194, 74);
    doc.rect(20, currentY, pageWidth - 40, 18, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('RECIBO', 30, currentY + 12);
    
    // Amount box on the right
    const amountText = `R$ ${receipt.amount.toFixed(2).replace('.', ',')}`;
    doc.setFontSize(16);
    doc.text(amountText, pageWidth - 30, currentY + 12, { align: 'right' });
    
    currentY += 25;

    // Receipt content with clean layout
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    // Received from section
    doc.setFont('helvetica', 'bold');
    doc.text('Recebi(emos) de:', 25, currentY);
    currentY += 6;
    
    doc.setFont('helvetica', 'normal');
    doc.setFillColor(245, 245, 245);
    doc.rect(25, currentY - 4, pageWidth - 50, 8, 'F');
    doc.setTextColor(0, 0, 0);
    doc.text(sanitizeTextForPDF(clientName).toUpperCase(), 28, currentY + 1);
    
    currentY += 12;

    // Amount in words section
    doc.setFont('helvetica', 'bold');
    doc.text('A quantia de:', 25, currentY);
    currentY += 6;
    
    doc.setFont('helvetica', 'normal');
    doc.setFillColor(245, 245, 245);
    const amountInWords = numberToWords(receipt.amount).toUpperCase();
    const amountLines = doc.splitTextToSize(amountInWords, pageWidth - 56);
    const amountBoxHeight = Math.max(8, amountLines.length * 5 + 3);
    doc.rect(25, currentY - 4, pageWidth - 50, amountBoxHeight, 'F');
    doc.text(amountLines, 28, currentY + 1);
    
    currentY += amountBoxHeight + 8;

    // Reference section
    doc.setFont('helvetica', 'bold');
    doc.text('Referente a:', 25, currentY);
    currentY += 6;
    
    doc.setFont('helvetica', 'normal');
    const referenceText = receipt.reference || 'Conforme acertado';
    const referenceLines = doc.splitTextToSize(sanitizeTextForPDF(referenceText).toUpperCase(), pageWidth - 56);
    const refBoxHeight = Math.max(12, referenceLines.length * 5 + 3);
    doc.setFillColor(245, 245, 245);
    doc.rect(25, currentY - 4, pageWidth - 50, refBoxHeight, 'F');
    doc.text(referenceLines, 28, currentY + 1);
    
    currentY += refBoxHeight + 10;

    // Additional details if provided
    if (receipt.payment_method) {
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.rect(25, currentY, pageWidth - 50, 8, 'S');
      
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      
      const paymentMethods: Record<string, string> = {
        'dinheiro': 'Dinheiro',
        'pix': 'PIX',
        'credito': 'Cartão de Crédito',
        'debito': 'Cartão de Débito',
        'boleto': 'Boleto Bancário',
        'link': 'Link'
      };
      const paymentText = `Forma de Pagamento: ${paymentMethods[receipt.payment_method] || receipt.payment_method}`;
      doc.text(paymentText, pageWidth / 2, currentY + 5, { align: 'center' });
      currentY += 15;
    }

    // Date and location
    currentY += 15;
    
    // Safe date formatting - handle invalid dates
    let today = new Date();
    if (receipt.payment_date) {
      const testDate = new Date(receipt.payment_date);
      if (!isNaN(testDate.getTime())) {
        today = testDate;
      }
    } else if (receipt.created_at) {
      const testDate = new Date(receipt.created_at);
      if (!isNaN(testDate.getTime())) {
        today = testDate;
      }
    }
    
    const day = today.getDate();
    const monthName = today.toLocaleDateString('pt-BR', { month: 'long' });
    const year = today.getFullYear();
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Esmeraldas/MG, ${day} de ${monthName} de ${year}`, pageWidth / 2, currentY, { align: 'center' });
    
    currentY += 25;

    // Signature section
    doc.setDrawColor(108, 194, 74);
    doc.setLineWidth(0.8);
    doc.line(pageWidth / 2 - 50, currentY, pageWidth / 2 + 50, currentY);
    
    currentY += 5;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(108, 194, 74);
    doc.text('RODA BEM TURISMO', pageWidth / 2, currentY, { align: 'center' });
    currentY += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Daniel de Paiva Rezende Oliveira', pageWidth / 2, currentY, { align: 'center' });
    currentY += 3.5;
    doc.text('CNPJ: 27.643.735/0001-90', pageWidth / 2, currentY, { align: 'center' });

    // Footer decoration
    const footerY = pageHeight - 15;
    doc.setDrawColor(108, 194, 74);
    doc.setLineWidth(0.3);
    doc.line(20, footerY, pageWidth - 20, footerY);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text('Este documento é válido como comprovante de pagamento', pageWidth / 2, footerY + 4, { align: 'center' });

    // Download
    const sanitizedName = sanitizeTextForPDF(clientName);
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `Recibo_${sanitizedName}_${dateStr}.pdf`;
    doc.save(filename);
  } catch (error) {
    console.error('Error generating receipt PDF:', error);
    throw error;
  }
}

// Generate monthly time records report
export interface TimeRecordReportData {
  records: Array<{
    id: string;
    user_name: string;
    user_email: string;
    date: string;
    clock_in: Date | string;
    clock_out?: Date | string | null;
    break_start?: Date | string | null;
    break_end?: Date | string | null;
    break_duration_minutes: number;
    total_hours: number;
  }>;
  month: string;
  year: string;
  employee?: string;
}

export async function generateTimeRecordReport(data: TimeRecordReportData): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  await addLogoToPDF(doc, pageWidth / 2 - 25, 10, 50, 50);
  
  let currentY = 70;
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(108, 194, 74);
  doc.text('RELATÓRIO DE PONTO MENSAL', pageWidth / 2, currentY, { align: 'center' });
  
  currentY += 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text(`Período: ${data.month}/${data.year}`, pageWidth / 2, currentY, { align: 'center' });
  
  if (data.employee) {
    currentY += 6;
    doc.text(`Funcionário: ${sanitizeTextForPDF(data.employee)}`, pageWidth / 2, currentY, { align: 'center' });
  }
  
  currentY += 15;
  
  const formatTime = (date: Date | string | null | undefined): string => {
    if (!date) return '--:--';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };
  
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };
  
  const tableData = data.records.map(record => [
    new Date(record.date).toLocaleDateString('pt-BR'),
    sanitizeTextForPDF(record.user_name),
    formatTime(record.clock_in),
    record.break_duration_minutes > 0 ? formatDuration(record.break_duration_minutes) : '-',
    formatTime(record.clock_out),
    record.total_hours > 0 ? record.total_hours.toFixed(2) + 'h' : '-',
  ]);
  
  autoTable(doc, {
    startY: currentY,
    head: [['Data', 'Funcionário', 'Entrada', 'Intervalo', 'Saída', 'Total']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [108, 194, 74],
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 9,
      halign: 'center',
    },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 45, halign: 'left' },
      2: { cellWidth: 20 },
      3: { cellWidth: 25 },
      4: { cellWidth: 20 },
      5: { cellWidth: 20 },
    },
    margin: { left: 14, right: 14 },
  });
  
  const finalY = (doc as any).lastAutoTable.finalY + 15;
  
  const totalDays = data.records.length;
  const totalHours = data.records.reduce((sum, record) => sum + record.total_hours, 0);
  const totalBreakMinutes = data.records.reduce((sum, record) => sum + record.break_duration_minutes, 0);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(108, 194, 74);
  doc.text('RESUMO DO PERÍODO', 14, finalY);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(`Dias trabalhados: ${totalDays}`, 14, finalY + 8);
  doc.text(`Total de horas trabalhadas: ${totalHours.toFixed(2)}h`, 14, finalY + 15);
  doc.text(`Total de intervalos: ${formatDuration(totalBreakMinutes)}`, 14, finalY + 22);
  
  const avgHours = totalDays > 0 ? (totalHours / totalDays).toFixed(2) : '0.00';
  doc.text(`Média de horas por dia: ${avgHours}h`, 14, finalY + 29);
  
  const footerY = doc.internal.pageSize.getHeight() - 20;
  doc.setDrawColor(108, 194, 74);
  doc.setLineWidth(0.3);
  doc.line(14, footerY, pageWidth - 14, footerY);
  
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  const generatedDate = new Date().toLocaleDateString('pt-BR', { 
    day: '2-digit', 
    month: 'long', 
    year: 'numeric' 
  });
  doc.text(`Relatório gerado em ${generatedDate}`, pageWidth / 2, footerY + 5, { align: 'center' });
  
  const filename = `Relatorio_Ponto_${data.month}_${data.year}.pdf`;
  doc.save(filename);
}

interface ReportData {
  receipts: Receipt[];
  periodLabel: string;
  range: { start: Date; end: Date };
}

export async function generateReceiptsReportPDF(data: ReportData): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, 210, 297, 'F');
  
  await addLogoToPDF(doc, 15, 10, 25, 25);
  
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text('RODA BEM', 50, 20);
  doc.text('TURISMO', 50, 28);
  
  doc.setFontSize(8);
  doc.text('Rua Visconde de Caeté, n.º 44 - Centro - Esmeraldas - MG', 50, 35);
  doc.text('Tel: (0xx31) 3536-7414 - (0xx31) 99932-5441', 80, 40);
  doc.text('CNPJ/ME: 27.643.750/0019-0', 95, 45);
  
  let currentY = 65;
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(108, 194, 74);
  doc.text('RELATÓRIO DE RECIBOS', pageWidth / 2, currentY, { align: 'center' });
  currentY += 10;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text(`Período: ${data.periodLabel}`, pageWidth / 2, currentY, { align: 'center' });
  currentY += 15;
  
  const tableData = data.receipts.map((receipt) => {
    const receiptDate = new Date(receipt.created_at);
    return [
      sanitizeTextForPDF(receipt.name || 'Cliente'),
      new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(receipt.amount),
      receiptDate.toLocaleDateString('pt-BR'),
      receipt.payment_method === 'dinheiro' ? 'Dinheiro' :
      receipt.payment_method === 'pix' ? 'PIX' :
      receipt.payment_method === 'credito' ? 'Crédito' :
      receipt.payment_method === 'debito' ? 'Débito' :
      receipt.payment_method === 'boleto' ? 'Boleto' :
      receipt.payment_method === 'link' ? 'Link' : receipt.payment_method,
      sanitizeTextForPDF(receipt.reference || 'Conforme acertado'),
    ];
  });
  
  autoTable(doc, {
    startY: currentY,
    head: [['Cliente', 'Valor', 'Data', 'Forma Pgto', 'Referente a']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [108, 194, 74],
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: 45, halign: 'left' },
      1: { cellWidth: 28, halign: 'right' },
      2: { cellWidth: 23, halign: 'center' },
      3: { cellWidth: 28, halign: 'center' },
      4: { cellWidth: 71, halign: 'left' },
    },
    margin: { left: 14, right: 14 },
  });
  
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  const totalRevenue = data.receipts.reduce((sum, receipt) => sum + receipt.amount, 0);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(108, 194, 74);
  doc.text('RESUMO DO PERÍODO', 14, finalY);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(`Total de recibos: ${data.receipts.length}`, 14, finalY + 8);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`Receita Total: ${new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(totalRevenue)}`, 14, finalY + 18);
  
  const footerY = doc.internal.pageSize.getHeight() - 20;
  doc.setDrawColor(108, 194, 74);
  doc.setLineWidth(0.3);
  doc.line(14, footerY, pageWidth - 14, footerY);
  
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  const generatedDate = new Date().toLocaleDateString('pt-BR', { 
    day: '2-digit', 
    month: 'long', 
    year: 'numeric' 
  });
  doc.text(`Relatório gerado em ${generatedDate}`, pageWidth / 2, footerY + 5, { align: 'center' });
  
  const reportTypeLabel = data.periodLabel.includes('Semana') ? 'Semanal' :
                          data.periodLabel.includes(' de ') && !data.periodLabel.includes('Semana') ? 'Mensal' :
                          'Diario';
  const filename = `Relatorio_Recibos_${reportTypeLabel}_${new Date().getTime()}.pdf`;
  doc.save(filename);
}

// Helper to translate payment methods to Portuguese for PDF (with accents, sanitized for PDF)
const getPaymentMethodLabelPDF = (method: string | undefined): string => {
  const labels: Record<string, string> = {
    'avista': 'À Vista',
    'pix': 'PIX',
    'dinheiro': 'Dinheiro',
    'debito': 'Débito',
    'credito': 'Crédito',
    'crediario_agencia': 'Crediário da Agência',
    'credito_banco': 'Crédito do Banco',
    'boleto': 'Boleto',
    'link': 'Link',
    'credito_viagens_anteriores': 'Crédito de Viagens Anteriores',
  };
  return sanitizeTextForPDF(labels[method || ''] || method || 'Não informado');
};

// Safe date formatter that handles invalid dates
const formatDateSafe = (dateValue: string | Date | undefined | null): string => {
  if (!dateValue) return '-';
  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('pt-BR');
  } catch {
    return '-';
  }
};

interface PaymentHistoryClient {
  first_name?: string;
  last_name?: string;
  destination?: string;
  created_at?: string | Date;
  payment_method?: string;
  avista_payment_type?: string;
  down_payment_method?: string;
}

interface PaymentHistoryParcela {
  id?: string;
  amount?: number;
  due_date?: string;
  status?: string;
  paid_date?: string;
  payment_method?: string;
}

interface PaymentHistoryData {
  client: PaymentHistoryClient;
  totalTravelAmount: number;
  totalPaid: number;
  outstandingBalance: number;
  downPaymentAmount: number;
  entradaPaid: boolean;
  remainingInstallments: number;
  installmentAmount: number;
  parcelas?: PaymentHistoryParcela[];
}

export async function generatePaymentHistoryPDF(data: PaymentHistoryData): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, 210, 297, 'F');
  
  await addLogoToPDF(doc, 15, 10, 25, 25);
  
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text('RODA BEM', 50, 20);
  doc.text('TURISMO', 50, 28);
  
  doc.setFontSize(8);
  doc.text('Rua Visconde de Caete, n. 44 - Centro - Esmeraldas - MG', 50, 35);
  doc.text('Tel: (0xx31) 3536-7414 - (0xx31) 99932-5441', 80, 40);
  doc.text('CNPJ/ME: 27.643.750/0019-0', 95, 45);
  
  let currentY = 60;
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(108, 194, 74);
  doc.text(sanitizeTextForPDF('HISTÓRICO DE PAGAMENTO'), pageWidth / 2, currentY, { align: 'center' });
  currentY += 15;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  
  if (!data || !data.client) {
    console.error('No client data available for payment history PDF');
    return;
  }
  
  // Safe currency formatter that handles null/undefined/NaN
  const formatCurrencySafe = (value: number | undefined | null): string => {
    const safeValue = typeof value === 'number' && !isNaN(value) ? value : 0;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(safeValue);
  };
  
  const clientName = sanitizeTextForPDF(`${data.client.first_name || ''} ${data.client.last_name || ''}`.trim() || 'Cliente');
  const destination = sanitizeTextForPDF(data.client.destination || sanitizeTextForPDF('Não informado'));
  const contractDate = formatDateSafe(data.client.created_at) !== '-' ? formatDateSafe(data.client.created_at) : sanitizeTextForPDF('Não informado');
  const paymentMethod = getPaymentMethodLabelPDF(data.client.payment_method);
  const avistaType = data.client.payment_method === 'avista' && data.client.avista_payment_type
    ? ` (${getPaymentMethodLabelPDF(data.client.avista_payment_type)})`
    : '';
  
  doc.setFont('helvetica', 'bold');
  doc.text('DADOS DO CLIENTE', 14, currentY);
  currentY += 8;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Nome: ${clientName}`, 14, currentY);
  currentY += 6;
  doc.text(`Destino: ${destination}`, 14, currentY);
  currentY += 6;
  doc.text(`Data do Contrato: ${contractDate}`, 14, currentY);
  currentY += 6;
  doc.text(`Forma de Pagamento: ${paymentMethod}${avistaType}`, 14, currentY);
  currentY += 12;
  
  doc.setDrawColor(108, 194, 74);
  doc.setLineWidth(0.5);
  doc.line(14, currentY, pageWidth - 14, currentY);
  currentY += 8;
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(sanitizeTextForPDF('RESUMO FINANCEIRO'), 14, currentY);
  currentY += 10;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  
  doc.text(sanitizeTextForPDF('Valor Total da Viagem:'), 14, currentY);
  doc.text(formatCurrencySafe(data.totalTravelAmount), pageWidth - 14, currentY, { align: 'right' });
  currentY += 7;
  
  doc.setTextColor(0, 128, 0);
  doc.text(sanitizeTextForPDF('Total Já Pago:'), 14, currentY);
  doc.text(formatCurrencySafe(data.totalPaid), pageWidth - 14, currentY, { align: 'right' });
  currentY += 7;
  
  doc.setTextColor(data.outstandingBalance > 0 ? 200 : 0, data.outstandingBalance > 0 ? 0 : 128, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('Saldo Restante:', 14, currentY);
  doc.text(formatCurrencySafe(data.outstandingBalance), pageWidth - 14, currentY, { align: 'right' });
  currentY += 12;
  
  doc.setTextColor(0, 0, 0);
  doc.setDrawColor(108, 194, 74);
  doc.line(14, currentY, pageWidth - 14, currentY);
  currentY += 8;
  
  if (data.downPaymentAmount > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('ENTRADA', 14, currentY);
    currentY += 8;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Valor da Entrada: ${formatCurrencySafe(data.downPaymentAmount)}`, 14, currentY);
    doc.text(`Data: ${contractDate}`, 100, currentY);
    currentY += 6;
    doc.text(`Status: ${data.entradaPaid ? 'PAGO' : 'PENDENTE'}`, 14, currentY);
    if (data.client.down_payment_method) {
      doc.text(`Forma: ${getPaymentMethodLabelPDF(data.client.down_payment_method)}`, 100, currentY);
    }
    currentY += 12;
  }
  
  if ((data.parcelas && data.parcelas.length > 0) || data.remainingInstallments > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('PARCELAS', 14, currentY);
    currentY += 8;
    
    const tableData: string[][] = [];
    
    if (data.parcelas && data.parcelas.length > 0) {
      data.parcelas.forEach((parcela, idx) => {
        const dueDate = formatDateSafe(parcela.due_date);
        const paidDate = formatDateSafe(parcela.paid_date);
        const payMethod = parcela.payment_method
          ? getPaymentMethodLabelPDF(parcela.payment_method)
          : '-';
        const status = parcela.status === 'paid' ? 'PAGO' : 
                       parcela.status === 'overdue' ? 'VENCIDO' : 'PENDENTE';
        
        tableData.push([
          `${idx + 1}`,
          formatCurrencySafe(parcela.amount),
          dueDate,
          status,
          paidDate,
          payMethod,
        ]);
      });
    } else {
      for (let i = 0; i < data.remainingInstallments; i++) {
        tableData.push([
          `${i + 1}`,
          formatCurrencySafe(data.installmentAmount),
          '-',
          'PENDENTE',
          '-',
          '-',
        ]);
      }
    }
    
    autoTable(doc, {
      startY: currentY,
      head: [['N', 'Valor', 'Vencimento', 'Status', 'Pago em', 'Forma Pgto']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [108, 194, 74],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'center',
      },
      bodyStyles: {
        fontSize: 8,
      },
      columnStyles: {
        0: { cellWidth: 12, halign: 'center' },
        1: { cellWidth: 30, halign: 'right' },
        2: { cellWidth: 28, halign: 'center' },
        3: { cellWidth: 25, halign: 'center' },
        4: { cellWidth: 28, halign: 'center' },
        5: { cellWidth: 35, halign: 'center' },
      },
      margin: { left: 14, right: 14 },
      didParseCell: function(data: any) {
        if (data.section === 'body' && data.column.index === 3) {
          if (data.cell.raw === 'PAGO') {
            data.cell.styles.textColor = [0, 128, 0];
            data.cell.styles.fontStyle = 'bold';
          } else if (data.cell.raw === 'VENCIDO') {
            data.cell.styles.textColor = [200, 0, 0];
            data.cell.styles.fontStyle = 'bold';
          } else {
            data.cell.styles.textColor = [200, 150, 0];
          }
        }
      }
    });
  }
  
  const footerY = doc.internal.pageSize.getHeight() - 30;
  doc.setDrawColor(108, 194, 74);
  doc.setLineWidth(0.3);
  doc.line(14, footerY, pageWidth - 14, footerY);
  
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  const generatedDate = new Date().toLocaleDateString('pt-BR', { 
    day: '2-digit', 
    month: 'long', 
    year: 'numeric' 
  });
  doc.text(`Documento gerado em ${generatedDate}`, pageWidth / 2, footerY + 5, { align: 'center' });
  doc.text('Este documento e apenas para fins informativos.', pageWidth / 2, footerY + 10, { align: 'center' });
  
  const safeClientName = clientName.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `Historico_Pagamento_${safeClientName}_${new Date().getTime()}.pdf`;
  doc.save(filename);
}