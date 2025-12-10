import PDFDocument from 'pdfkit';

type PdfDoc = InstanceType<typeof PDFDocument>;

export type PdfColumn<T> = {
    header: string;
    accessor: (row: T) => string | number;
};

function safeText(value: unknown): string {
    if (value === null || value === undefined) return '-';
    return String(value).replace(/\s+/g, ' ').trim();
}

function drawTable<T>(doc: PdfDoc, columns: PdfColumn<T>[], rows: T[]) {
    const printableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const columnSpacing = 10;
    const columnWidth = Math.floor(
        (printableWidth - (columns.length - 1) * columnSpacing) / columns.length,
    );

    const drawRow = (values: string[], opts: { isHeader?: boolean; rowIndex?: number } = {}) => {
        const startY = doc.y;

        if (opts.isHeader) {
            doc.fillColor('#f0f0f0').rect(doc.x, startY, printableWidth, 18).fill();
            doc.fillColor('#000000');
        } else if (typeof opts.rowIndex === 'number' && opts.rowIndex % 2 === 0) {
            doc.fillColor('#fbfbfb').rect(doc.x, startY, printableWidth, 16).fill();
            doc.fillColor('#000000');
        }

        columns.forEach((column, index) => {
            const x = doc.x + index * (columnWidth + columnSpacing);
            const value = values[index] ?? '-';
            const height = doc.heightOfString(value, {
                width: columnWidth,
                align: 'left',
            });
            doc.font(opts.isHeader ? 'Helvetica-Bold' : 'Helvetica')
                .fontSize(opts.isHeader ? 11 : 10)
                .text(value, x + 2, startY + 4, {
                    width: columnWidth - 4,
                    align: 'left',
                    continued: false,
                });
            if (index < columns.length - 1) {
                doc.moveTo(x + columnWidth, startY)
                    .lineTo(x + columnWidth, startY + Math.max(height, opts.isHeader ? 18 : 16))
                    .stroke('#e0e0e0');
            }
        });

        const rowHeight = opts.isHeader ? 18 : 16;
        doc.y = startY + rowHeight;
        doc.x = doc.page.margins.left;
        doc.moveTo(doc.x, doc.y)
            .lineTo(doc.x + printableWidth, doc.y)
            .strokeColor('#e0e0e0')
            .stroke();
        doc.moveDown(0.1);
    };

    doc.strokeColor('#e0e0e0').lineWidth(0.5);
    drawRow(
        columns.map((column) => column.header),
        { isHeader: true },
    );

    rows.forEach((row, index) => {
        const rowValues = columns.map((column) => safeText(column.accessor(row)));
        drawRow(rowValues, { rowIndex: index });
    });
}

export function createAnalyticsReportPdf<T>(
    title: string,
    columns: PdfColumn<T>[],
    rows: T[],
    metadata?: Array<{ label: string; value: string }>,
): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: 'A4', margin: 40 });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        doc.font('Helvetica-Bold').fontSize(18).text(title, { align: 'center' });
        doc.moveDown();

        if (metadata && metadata.length) {
            doc.font('Helvetica').fontSize(11);
            metadata.forEach((entry) => {
                doc.text(`${entry.label}: ${entry.value}`);
            });
            doc.moveDown();
        }

        if (columns.length && rows.length) {
            drawTable(doc, columns, rows);
        } else if (columns.length && !rows.length) {
            doc.font('Helvetica').fontSize(12).text('No hay registros para mostrar.');
        }

        doc.end();
    });
}
