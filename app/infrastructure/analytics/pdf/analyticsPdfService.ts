import fs from 'fs';
import path from 'path';

import PDFDocument from 'pdfkit';

type PdfDoc = InstanceType<typeof PDFDocument>;

export type PdfColumn<T> = {
    header: string;
    accessor: (row: T) => string | number;
    width?: number; // peso relativo
    align?: 'left' | 'right' | 'center';
};

type MetadataEntry = { label: string; value: string };

type TableOptions = {
    columns: PdfColumn<unknown>[];
    rows: unknown[];
    startY: number;
    zebra?: boolean;
    headerHeight?: number;
    renderHeader: () => number;
    pageRef: { value: number };
    watermarkPath?: string;
};

type PdfOptions = {
    layout?: 'portrait' | 'landscape';
    metadata?: MetadataEntry[];
    watermarkPath?: string;
    extraTables?: Array<{ title: string; columns: PdfColumn<unknown>[]; rows: unknown[] }>;
};

const DEFAULT_WATERMARK_PATH = path.join(__dirname, 'assets', 'MSFAEG-logo.jpg');

const STYLES = {
    font: {
        base: 'Helvetica',
        bold: 'Helvetica-Bold',
    },
    size: {
        title: 16,
        header: 10,
        cell: 9,
        meta: 9,
        footer: 9,
    },
    padding: {
        cellX: 6,
        cellY: 4,
    },
    spacing: {
        column: 8,
        section: 8,
    },
    colors: {
        headerBg: '#f5f5f5',
        zebra: '#fbfbfb',
        border: '#e0e0e0',
        text: '#111111',
    },
    footerHeight: 18,
};

function safeText(value: unknown): string {
    if (value === null || value === undefined) return '-';
    const normalized = String(value).replace(/\r\n/g, '\n');
    const lines = normalized.split('\n').map((line) => line.replace(/\s+/g, ' ').trim());
    const result = lines.join('\n').trim();
    return result.length ? result : '-';
}

function drawWatermark(doc: PdfDoc, watermarkPath?: string) {
    const source = watermarkPath ?? DEFAULT_WATERMARK_PATH;
    if (!source || !fs.existsSync(source)) return;

    const printableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const usableHeight = doc.page.height - doc.page.margins.top - doc.page.margins.bottom;
    const targetWidth = printableWidth * 0.6;
    const x = doc.page.margins.left + printableWidth * 0.2;
    const y = doc.page.margins.top + usableHeight * 0.25;

    doc.save();
    doc.opacity(0.08);
    try {
        doc.image(source, x, y, { width: targetWidth });
    } catch {
        // si falla la imagen, continuamos sin marca de agua
    }
    doc.opacity(1);
    doc.restore();
}

function renderHeader(doc: PdfDoc, title: string, metadata?: MetadataEntry[]) {
    const { title: titleSize, meta } = STYLES.size;
    const marginLeft = doc.page.margins.left;
    const marginRight = doc.page.width - doc.page.margins.right;

    doc.fillColor(STYLES.colors.text).font(STYLES.font.bold).fontSize(titleSize);
    doc.text(title, marginLeft, doc.page.margins.top, {
        width: marginRight - marginLeft,
        align: 'left',
    });

    doc.font(STYLES.font.base).fontSize(meta);
    doc.text(`Exportado: ${new Date().toLocaleString()}`, {
        width: marginRight - marginLeft,
        align: 'left',
    });

    if (metadata?.length) {
        metadata.forEach((entry) => {
            doc.text(`${entry.label}: ${entry.value}`, {
                width: marginRight - marginLeft,
                align: 'left',
            });
        });
    }

    doc.moveDown(0.5);
    doc.moveTo(marginLeft, doc.y).lineTo(marginRight, doc.y).stroke(STYLES.colors.border);
    doc.moveDown(0.7);
}

function renderFooter(doc: PdfDoc, pageNumber: number) {
    const { footerHeight, colors, size, font } = STYLES;
    const footerY = doc.page.height - doc.page.margins.bottom - footerHeight;
    const marginLeft = doc.page.margins.left;
    const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;

    doc.font(font.base).fontSize(size.footer).fillColor(colors.text);
    doc.text(`Página ${pageNumber}`, marginLeft, footerY, { width, align: 'right' });
}

function computeColumnWidths(doc: PdfDoc, columns: PdfColumn<unknown>[]): number[] {
    const weights = columns.map((col) => (col.width && col.width > 0 ? col.width : 1));
    const totalWeight = weights.reduce((sum, value) => sum + value, 0);
    const printableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const available = printableWidth - (columns.length - 1) * STYLES.spacing.column;
    return weights.map((weight) => (weight / totalWeight) * available);
}

function measureRowHeight(
    doc: PdfDoc,
    values: string[],
    columnWidths: number[],
    isHeader: boolean,
): number {
    const lineHeight = doc.heightOfString('Ag', { width: 100, align: 'left' });
    const base = isHeader ? lineHeight + 6 : lineHeight + 4;
    let max = base;
    values.forEach((value, idx) => {
        const width = columnWidths[idx] - STYLES.padding.cellX * 2;
        const height = doc.heightOfString(value, {
            width,
            align: 'left',
        });
        max = Math.max(max, height + STYLES.padding.cellY * 2);
    });
    return max;
}

function drawTable(doc: PdfDoc, options: TableOptions) {
    const { columns, rows, zebra = true } = options;
    const printableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const columnWidths = computeColumnWidths(doc, columns);
    let y = options.startY;
    const pageRef = options.pageRef;

    const drawRow = (values: string[], opts: { isHeader?: boolean; rowIndex?: number }) => {
        const rowHeight = measureRowHeight(doc, values, columnWidths, !!opts.isHeader);

        const spaceNeeded = rowHeight + 4 + STYLES.footerHeight;
        const pageBottom = doc.page.height - doc.page.margins.bottom;
        if (y + spaceNeeded > pageBottom) {
            if (options.watermarkPath) drawWatermark(doc, options.watermarkPath);
            renderFooter(doc, pageRef.value);
            doc.addPage();
            pageRef.value += 1;
            y = options.renderHeader();
            drawHeader(); // repeat table header
        }

        const isStripe = zebra && typeof opts.rowIndex === 'number' && opts.rowIndex % 2 === 1;
        if (isStripe) {
            doc.rect(doc.page.margins.left, y, printableWidth, rowHeight)
                .fill(STYLES.colors.zebra)
                .fillColor(STYLES.colors.text);
        }

        let x = doc.page.margins.left;
        values.forEach((value, idx) => {
            const width = columnWidths[idx];
            const align = opts.isHeader ? 'left' : (columns[idx].align ?? 'left');
            doc.font(opts.isHeader ? STYLES.font.bold : STYLES.font.base)
                .fontSize(opts.isHeader ? STYLES.size.header : STYLES.size.cell)
                .fillColor(STYLES.colors.text)
                .text(value, x + STYLES.padding.cellX, y + STYLES.padding.cellY, {
                    width: width - STYLES.padding.cellX * 2,
                    align,
                });
            x += width + STYLES.spacing.column;
        });

        doc.strokeColor(STYLES.colors.border)
            .moveTo(doc.page.margins.left, y)
            .lineTo(doc.page.margins.left + printableWidth, y)
            .stroke();

        y += rowHeight;
        doc.moveTo(doc.page.margins.left, y)
            .lineTo(doc.page.margins.left + printableWidth, y)
            .stroke();
    };

    const drawHeader = () => {
        const headerValues = columns.map((column) => column.header);
        const headerHeight = measureRowHeight(doc, headerValues, columnWidths, true);
        const spaceNeeded = headerHeight + 4 + STYLES.footerHeight;
        const pageBottom = doc.page.height - doc.page.margins.bottom;
        if (y + spaceNeeded > pageBottom) {
            if (options.watermarkPath) drawWatermark(doc, options.watermarkPath);
            renderFooter(doc, pageRef.value);
            doc.addPage();
            pageRef.value += 1;
            y = options.renderHeader();
        }

        doc.rect(doc.page.margins.left, y, printableWidth, headerHeight)
            .fill(STYLES.colors.headerBg)
            .fillColor(STYLES.colors.text);
        let x = doc.page.margins.left;
        headerValues.forEach((value, idx) => {
            const width = columnWidths[idx];
            doc.font(STYLES.font.bold)
                .fontSize(STYLES.size.header)
                .text(value, x + STYLES.padding.cellX, y + STYLES.padding.cellY, {
                    width: width - STYLES.padding.cellX * 2,
                    align: 'left',
                });
            x += width + STYLES.spacing.column;
        });
        y += headerHeight;
        doc.moveTo(doc.page.margins.left, y)
            .lineTo(doc.page.margins.left + printableWidth, y)
            .stroke(STYLES.colors.border);
    };

    drawHeader();
    rows.forEach((row, idx) => {
        const rowValues = columns.map((column) => safeText(column.accessor(row)));
        drawRow(rowValues, { rowIndex: idx });
    });

    if (options.watermarkPath) drawWatermark(doc, options.watermarkPath);
    renderFooter(doc, pageRef.value);
}

export function createAnalyticsReportPdf<T>(
    title: string,
    columns: PdfColumn<T>[],
    rows: T[],
    metadata?: Array<{ label: string; value: string }>,
    options?: PdfOptions,
): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({
            size: 'A4',
            margin: 42,
            layout: options?.layout ?? 'portrait',
        });
        const chunks: Buffer[] = [];
        const pageRef = { value: 1 };
        const watermarkPath = options?.watermarkPath ?? DEFAULT_WATERMARK_PATH;

        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        const renderPageHeader = () => {
            renderHeader(doc, title, metadata ?? options?.metadata);
            return doc.y;
        };

        if (columns.length && rows.length) {
            drawTable(doc, {
                columns: columns as PdfColumn<unknown>[],
                rows: rows as unknown[],
                startY: renderPageHeader(),
                zebra: true,
                renderHeader: renderPageHeader,
                pageRef,
                watermarkPath,
            });
        } else if (columns.length && !rows.length) {
            renderPageHeader();
            doc.font(STYLES.font.base)
                .fontSize(STYLES.size.cell)
                .text('No hay registros para mostrar.');
            renderFooter(doc, pageRef.value);
        }

        if (options?.extraTables?.length) {
            for (const table of options.extraTables) {
                doc.addPage();
                pageRef.value += 1;
                drawWatermark(doc, watermarkPath);
                const start = renderPageHeader();
                doc.font(STYLES.font.bold)
                    .fontSize(STYLES.size.header)
                    .text(table.title, doc.page.margins.left, start);
                doc.moveDown(0.5);
                drawTable(doc, {
                    columns: table.columns,
                    rows: table.rows,
                    startY: doc.y,
                    zebra: true,
                    renderHeader: renderPageHeader,
                    pageRef,
                    watermarkPath,
                });
            }
        }

        doc.end();
    });
}
