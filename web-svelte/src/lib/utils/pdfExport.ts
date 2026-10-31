import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { RegistryItem } from '../api/client';

export interface ReportMeta {
	title?: string;
	docNo?: string;
	filterSummary?: string;
	printedBy?: string;
}

export interface BastOptions {
	docNo: string;
	date: string;
	partyOne: string;
	partyTwo: string;
	items: Array<{ name: string; code: string; qty: number; val: number }>;
	signatureImg?: string;
}

const formatCurrency = (val: number | null): string => {
	if (val === null || val === undefined) return 'Rp 0';
	return new Intl.NumberFormat('id-ID', {
		style: 'currency',
		currency: 'IDR',
		maximumFractionDigits: 0
	}).format(val);
};

export function exportRegistryReport(items: RegistryItem[], meta: ReportMeta = {}): void {
	const doc = new jsPDF({
		orientation: 'landscape',
		unit: 'mm',
		format: 'a4'
	});

	const pageWidth = doc.internal.pageSize.getWidth();
	const printDate = new Date().toLocaleString('id-ID', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});

	const docNo = meta.docNo || `REP-GOB/${new Date().getFullYear()}/${Date.now().toString().slice(-6)}`;
	const title = meta.title || 'LAPORAN RESMI AUDIT ASET NEGARA (GOBUDIBASE)';

	const totalValuation = items.reduce((sum, item) => sum + (item.value || 0), 0);

	// Header Banner
	doc.setFillColor(30, 41, 59);
	doc.rect(14, 10, pageWidth - 28, 22, 'F');

	doc.setTextColor(255, 255, 255);
	doc.setFontSize(14);
	doc.setFont('helvetica', 'bold');
	doc.text('GOBUDIBASE ENTERPRISE — SISTEM MANAJEMEN ASET', 20, 18);

	doc.setFontSize(10);
	doc.setFont('helvetica', 'normal');
	doc.setTextColor(203, 213, 225);
	doc.text(title, 20, 26);

	doc.setFontSize(8);
	doc.text(`NO DOKUMEN: ${docNo} | CETAK: ${printDate} WIB`, pageWidth - 20, 18, { align: 'right' });
	doc.text(`TOTAL REKOR: ${items.length} Aset | VALUASI: ${formatCurrency(totalValuation)}`, pageWidth - 20, 26, { align: 'right' });

	// AutoTable
	const tableData = items.map((item, index) => [
		(index + 1).toString(),
		item.code || '-',
		item.name || '-',
		item.category || '-',
		item.location || 'Unassigned',
		(item.status || '-').toUpperCase(),
		formatCurrency(item.value)
	]);

	autoTable(doc, {
		startY: 38,
		head: [['No', 'Kode Aset', 'Nama Inventaris', 'Kategori', 'Lokasi', 'Status', 'Nilai Aset (Rp)']],
		body: tableData,
		theme: 'grid',
		headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
		bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
		alternateRowStyles: { fillColor: [248, 250, 252] },
		margin: { left: 14, right: 14 }
	});

	doc.save(`Laporan_Aset_GoBudiBase_${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function exportAssetReceiptSlip(item: RegistryItem, signatureDataUrl?: string): void {
	const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
	const pageWidth = doc.internal.pageSize.getWidth();

	doc.setFontSize(14);
	doc.setFont('helvetica', 'bold');
	doc.text('BERITA ACARA SERAH TERIMA & KARTU ASET (BAST)', pageWidth / 2, 22, { align: 'center' });

	doc.setFontSize(9);
	doc.setFont('helvetica', 'normal');
	doc.text(`Nomor Registrasi: BAST-GOB/${item.id}/${new Date().getFullYear()}`, pageWidth / 2, 28, { align: 'center' });

	autoTable(doc, {
		startY: 38,
		head: [['Spesifikasi Aset', 'Keterangan Terdaftar']],
		body: [
			['ID Registrasi', `#${item.id}`],
			['Kode Aset', item.code || '-'],
			['Nama Fasilitas', item.name || '-'],
			['Kategori Klasifikasi', item.category || '-'],
			['Lokasi Fisik', item.location || 'Unassigned'],
			['Status Operasional', (item.status || '-').toUpperCase()],
			['Nilai Perolehan', formatCurrency(item.value)]
		],
		margin: { left: 20, right: 20 }
	});

	// @ts-expect-error jspdf-autotable extends jsPDF
	const afterY = doc.lastAutoTable.finalY + 15;
	doc.text('PIHAK PERTAMA (Menyerahkan)', 20, afterY);
	doc.text('PIHAK KEDUA (Menerima / PJ)', pageWidth - 70, afterY);

	if (signatureDataUrl) {
		try {
			doc.addImage(signatureDataUrl, 'PNG', pageWidth - 70, afterY + 5, 40, 20);
		} catch {}
	}

	doc.save(`BAST_Aset_${item.code || item.id}.pdf`);
}

export function exportBastPdf(opts: BastOptions): void {
	const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
	const pageWidth = doc.internal.pageSize.getWidth();

	doc.setFillColor(30, 41, 59);
	doc.rect(14, 12, pageWidth - 28, 20, 'F');

	doc.setTextColor(255, 255, 255);
	doc.setFontSize(13);
	doc.setFont('helvetica', 'bold');
	doc.text('BERITA ACARA SERAH TERIMA OPERASIONAL (BAST)', 20, 22);

	doc.setFontSize(9);
	doc.setFont('helvetica', 'normal');
	doc.text(`NO DOKUMEN: ${opts.docNo}`, 20, 28);
	doc.text(`TANGGAL: ${opts.date}`, pageWidth - 20, 28, { align: 'right' });

	doc.setTextColor(30, 41, 59);
	doc.setFontSize(9.5);
	doc.text('Pada hari ini telah diserahterimakan aset inventaris negara kepada pihak pemegang mandat:', 14, 40);

	const tableData = opts.items.map((it, idx) => [
		(idx + 1).toString(),
		it.code,
		it.name,
		it.qty.toString(),
		formatCurrency(it.val)
	]);

	autoTable(doc, {
		startY: 46,
		head: [['No', 'Kode Barang', 'Deskripsi Aset', 'Qty', 'Nilai Perolehan (IDR)']],
		body: tableData,
		theme: 'grid',
		headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
		bodyStyles: { fontSize: 8 },
		margin: { left: 14, right: 14 }
	});

	// @ts-expect-error jspdf-autotable extends jsPDF
	const afterY = doc.lastAutoTable.finalY + 16;
	doc.setFontSize(9);
	doc.text('PIHAK PERTAMA (Menyerahkan):', 20, afterY);
	doc.text(opts.partyOne, 20, afterY + 6);

	doc.text('PIHAK KEDUA (Menerima):', pageWidth - 80, afterY);
	doc.text(opts.partyTwo, pageWidth - 80, afterY + 6);

	if (opts.signatureImg) {
		try {
			doc.addImage(opts.signatureImg, 'PNG', pageWidth - 80, afterY + 10, 42, 22);
		} catch {}
	}

	doc.save(`${opts.docNo.replace(/[/\\?%*:|"<>]/g, '_')}.pdf`);
}
