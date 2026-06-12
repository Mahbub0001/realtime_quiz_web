import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

/**
 * Export leaderboard to PDF
 * @param {Array} leaderboard - Array of leaderboard entries
 * @param {string} quizTitle - Title of the quiz
 * @param {string} sessionCode - Session code
 */
export function exportToPDF(leaderboard, quizTitle = 'Quiz', sessionCode = '') {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.setTextColor(79, 70, 229); // Indigo
  doc.text('Quiz Leaderboard', 14, 20);

  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100);
  doc.text(`Quiz: ${quizTitle}`, 14, 30);
  doc.text(`Session Code: ${sessionCode}`, 14, 37);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 44);
  doc.text(`Total Participants: ${leaderboard.length}`, 14, 51);

  // Table
  const tableData = leaderboard.map((entry) => [
    entry.rank,
    entry.student_name,
    entry.university_id,
    entry.total_score,
    entry.correct_answers,
  ]);

  autoTable(doc, {
    startY: 58,
    head: [['Rank', 'Student Name', 'University ID', 'Score', 'Correct Answers']],
    body: tableData,
    styles: {
      fontSize: 10,
      cellPadding: 4,
    },
    headStyles: {
      fillColor: [79, 70, 229],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 247, 255],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 18 },
      3: { halign: 'center' },
      4: { halign: 'center' },
    },
    // Highlight top 3
    didParseCell: (data) => {
      if (data.section === 'body') {
        const rank = data.row.index + 1;
        if (rank === 1) data.cell.styles.fillColor = [255, 215, 0];   // Gold
        if (rank === 2) data.cell.styles.fillColor = [192, 192, 192]; // Silver
        if (rank === 3) data.cell.styles.fillColor = [205, 127, 50];  // Bronze
      }
    },
  });

  const filename = `leaderboard_${sessionCode}_${Date.now()}.pdf`;
  doc.save(filename);
}

/**
 * Export leaderboard to Excel (.xlsx)
 * @param {Array} leaderboard - Array of leaderboard entries
 * @param {string} quizTitle - Title of the quiz
 * @param {string} sessionCode - Session code
 */
export function exportToExcel(leaderboard, quizTitle = 'Quiz', sessionCode = '') {
  // Build worksheet data
  const wsData = [
    // Title rows
    ['Quiz Leaderboard'],
    [`Quiz: ${quizTitle}`],
    [`Session Code: ${sessionCode}`],
    [`Generated: ${new Date().toLocaleString()}`],
    [`Total Participants: ${leaderboard.length}`],
    [], // empty row
    // Header row
    ['Rank', 'Student Name', 'University ID', 'Score', 'Correct Answers'],
    // Data rows
    ...leaderboard.map((entry) => [
      entry.rank,
      entry.student_name,
      entry.university_id,
      entry.total_score,
      entry.correct_answers,
    ]),
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Column widths
  ws['!cols'] = [
    { wch: 8 },   // Rank
    { wch: 28 },  // Student Name
    { wch: 18 },  // University ID
    { wch: 10 },  // Score
    { wch: 18 },  // Correct Answers
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Leaderboard');

  const filename = `leaderboard_${sessionCode}_${Date.now()}.xlsx`;
  XLSX.writeFile(wb, filename);
}
