import type { jsPDF } from 'jspdf';
import type * as XLSX from 'xlsx';

type AutoTableFunction = typeof import('jspdf-autotable').default;

export const REPORT_CATEGORIES = ['Cubicles', 'Instruments', 'Tools'] as const;

export type ReportCategory = (typeof REPORT_CATEGORIES)[number];
export type ReportCategorySelection = ReportCategory | 'All Categories';

export interface ReportExportEntry {
    item_type: string;
    usage_count: number;
}

export type ReportsByCategory = Partial<Record<ReportCategory, readonly ReportExportEntry[]>>;

export interface ReportExportOptions {
    selectedCategory: ReportCategorySelection;
    reportsByCategory: ReportsByCategory;
    startDate: Date | null;
    endDate: Date | null;
}

const REPORT_TITLE = 'UNIVERSITY OF THE IMMACULATE CONCEPTION - COLLEGE OF MUSIC';
const REPORT_SUBTITLE = 'Resource Usage & Analytics Report';
const TOTAL_LABEL = 'Total';
function getDateRangeLabel(startDate: Date | null, endDate: Date | null): string {
    const formatDate = (date: Date) => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date);

    if (startDate && endDate) {
        return `${formatDate(startDate)} - ${formatDate(endDate)}`;
    }
    if (startDate) {
        return `From ${formatDate(startDate)}`;
    }
    if (endDate) {
        return `Through ${formatDate(endDate)}`;
    }
    return 'All Time';
}

function getGeneratedTimestamp(): string {
    return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date());
}

function getFileDate(): string {
    return new Date().toISOString().slice(0, 10);
}

function getSafeFilenameCategory(category: string): string {
    return category
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

function getCategoryRows(options: ReportExportOptions): Array<[string, readonly ReportExportEntry[]]> {
    const selectedCategories = options.selectedCategory === 'All Categories' ? REPORT_CATEGORIES : [options.selectedCategory];

    return selectedCategories.map((category) => {
        const rows = options.reportsByCategory[category];
        if (!Array.isArray(rows)) {
            throw new Error(`Export data for ${category} is missing or invalid.`);
        }
        return [category, rows];
    });
}

function getTotal(rows: readonly ReportExportEntry[]): number {
    return rows.reduce((total, row) => total + row.usage_count, 0);
}

function addReportHeader(doc: jsPDF, dateRange: string, category: string): number {
    const pageWidth = doc.internal.pageSize.getWidth();
    const centerX = pageWidth / 2;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    while (doc.getTextWidth(REPORT_TITLE) > pageWidth - 20 && doc.getFontSize() > 8) {
        doc.setFontSize(doc.getFontSize() - 0.5);
    }
    doc.text(REPORT_TITLE, centerX, 16, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(REPORT_SUBTITLE, centerX, 23, { align: 'center' });

    doc.setFontSize(9);
    const metadata = `Category: ${category}    Date Range: ${dateRange}`;
    doc.text(metadata, 14, 33);

    return 40;
}

function addReportTable(
    doc: jsPDF,
    autoTable: AutoTableFunction,
    rows: readonly ReportExportEntry[],
    startY: number,
    firstColumnHeader = 'Item Type',
): number {
    const body: Array<[string, number]> = rows.map((row) => [row.item_type, row.usage_count]);
    body.push([TOTAL_LABEL, getTotal(rows)]);
    let finalY = startY;

    autoTable(doc, {
        startY,
        head: [[firstColumnHeader, 'Usage Count']],
        body,
        margin: { left: 14, right: 14, top: 16, bottom: 22 },
        styles: { font: 'helvetica', fontSize: 9, cellPadding: 2.5 },
        headStyles: { fillColor: [58, 75, 110], fontStyle: 'bold' },
        didParseCell: (data) => {
            if (data.section === 'body' && data.row.index === rows.length) {
                data.cell.styles.fontStyle = 'bold';
                data.cell.styles.fillColor = [238, 241, 246];
            }
        },
        didDrawPage: (data) => {
            if (data.cursor) {
                finalY = data.cursor.y;
            }
        },
    });

    return finalY;
}

function addPageFooters(doc: jsPDF, generatedOn: string): void {
    const pageCount = doc.getNumberOfPages();
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();

    for (let page = 1; page <= pageCount; page += 1) {
        doc.setPage(page);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(`Generated on: ${generatedOn}`, 14, pageHeight - 8);
        doc.text(`Page ${page} of ${pageCount}`, pageWidth - 14, pageHeight - 8, { align: 'right' });
    }
}

export async function exportReportsToPdf(options: ReportExportOptions): Promise<void> {
    const dateRange = getDateRangeLabel(options.startDate, options.endDate);
    const categories = getCategoryRows(options);
    const [{ jsPDF }, autoTableModule] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
    const autoTable = autoTableModule.default;
    const doc = new jsPDF();
    let cursorY = addReportHeader(doc, dateRange, options.selectedCategory);

    if (options.selectedCategory !== 'All Categories') {
        addReportTable(doc, autoTable, categories[0][1], cursorY);
    } else {
        const categoryTotals: Array<[string, number]> = [];

        for (const [category, rows] of categories) {
            const pageHeight = doc.internal.pageSize.getHeight();
            if (cursorY + 16 > pageHeight - 22) {
                doc.addPage();
                cursorY = 18;
            }

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.text(category, 14, cursorY);
            cursorY += 4;
            cursorY = addReportTable(doc, autoTable, rows, cursorY) + 10;
            categoryTotals.push([category, getTotal(rows)]);
        }

        if (cursorY + 18 > doc.internal.pageSize.getHeight() - 22) {
            doc.addPage();
            cursorY = 18;
        }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('Grand Total', 14, cursorY);
        cursorY += 4;
        const grandTotal = categoryTotals.reduce((total, [, count]) => total + count, 0);
        autoTable(doc, {
            startY: cursorY,
            head: [['Category', 'Usage Count']],
            body: [...categoryTotals, ['Grand Total', grandTotal]],
            margin: { left: 14, right: 14, top: 16, bottom: 22 },
            styles: { font: 'helvetica', fontSize: 9, cellPadding: 2.5 },
            headStyles: { fillColor: [58, 75, 110], fontStyle: 'bold' },
            didParseCell: (data) => {
                if (data.section === 'body' && data.row.index === categoryTotals.length) {
                    data.cell.styles.fontStyle = 'bold';
                    data.cell.styles.fillColor = [238, 241, 246];
                }
            },
        });
    }

    addPageFooters(doc, getGeneratedTimestamp());
    const filenameCategory = getSafeFilenameCategory(options.selectedCategory);
    doc.save(`usage-report-${filenameCategory}-${getFileDate()}.pdf`);
}

function createCategoryWorksheet(xlsx: typeof import('xlsx'), rows: readonly ReportExportEntry[]): XLSX.WorkSheet {
    return xlsx.utils.aoa_to_sheet([
        ['Item Type', 'Usage Count'],
        ...rows.map((row) => [row.item_type, row.usage_count]),
        [TOTAL_LABEL, getTotal(rows)],
    ]);
}

export async function exportReportsToExcel(options: ReportExportOptions): Promise<void> {
    const categories = getCategoryRows(options);
    const XLSX = await import('xlsx');
    const workbook = XLSX.utils.book_new();

    if (options.selectedCategory === 'All Categories') {
        const summary: Array<[string, number]> = [];

        for (const [category, rows] of categories) {
            XLSX.utils.book_append_sheet(workbook, createCategoryWorksheet(XLSX, rows), category);
            summary.push([category, getTotal(rows)]);
        }

        const grandTotal = summary.reduce((total, [, count]) => total + count, 0);
        const summarySheet = XLSX.utils.aoa_to_sheet([['Category', 'Total Usage'], ...summary, ['Grand Total', grandTotal]]);
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Consolidated Summary');
        XLSX.writeFile(workbook, `usage-report-all-categories-${getFileDate()}.xlsx`);
        return;
    }

    XLSX.utils.book_append_sheet(workbook, createCategoryWorksheet(XLSX, categories[0][1]), options.selectedCategory);
    XLSX.writeFile(workbook, `usage-report-${getSafeFilenameCategory(options.selectedCategory)}-${getFileDate()}.xlsx`);
}
