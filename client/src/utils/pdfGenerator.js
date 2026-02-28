import jsPDF from "jspdf";
import "jspdf-autotable";

export const generatePrescriptionPDF = (prescription) => {
  const doc = new jsPDF();
  const { patientId: patient, doctorId: doctor, medicines, diagnosis, instructions, createdAt, followUpDate } = prescription;

  // Header
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, 210, 35, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("MEDICAL PRESCRIPTION", 105, 15, { align: "center" });
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("AI Clinic Management System", 105, 25, { align: "center" });

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.text(`Dr. ${doctor?.name || "N/A"}`, 14, 45);
  doc.text(`Specialization: ${doctor?.specialization || "General Physician"}`, 14, 52);
  doc.text(`Date: ${new Date(createdAt).toLocaleDateString()}`, 150, 45);
  doc.text(`Rx No: ${prescription._id?.slice(-8).toUpperCase()}`, 150, 52);

  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(0.5);
  doc.line(14, 57, 196, 57);

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Patient Information", 14, 65);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Name: ${patient?.name || "N/A"}`, 14, 73);
  doc.text(`Age: ${patient?.age || "N/A"} | Gender: ${patient?.gender || "N/A"}`, 14, 80);

  if (diagnosis) {
    doc.setFont("helvetica", "bold");
    doc.text("Diagnosis:", 14, 92);
    doc.setFont("helvetica", "normal");
    doc.text(diagnosis, 50, 92);
  }

  doc.setFont("helvetica", "bold");
  doc.text("Prescribed Medicines", 14, 102);
  doc.autoTable({
    startY: 106,
    head: [["Medicine", "Dosage", "Frequency", "Duration", "Instructions"]],
    body: medicines.map((m) => [m.name, m.dosage, m.frequency, m.duration, m.instructions || "-"]),
    headStyles: { fillColor: [37, 99, 235], textColor: 255 },
    alternateRowStyles: { fillColor: [239, 246, 255] },
    styles: { fontSize: 9, cellPadding: 3 },
    margin: { left: 14, right: 14 },
  });

  let finalY = doc.lastAutoTable.finalY + 10;

  if (instructions) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Doctor Notes:", 14, finalY);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(instructions, 170);
    doc.text(lines, 14, finalY + 7);
    finalY += 7 + lines.length * 5 + 5;
  }

  if (followUpDate) {
    doc.setFont("helvetica", "bold");
    doc.text(`Follow-up: ${new Date(followUpDate).toLocaleDateString()}`, 14, finalY + 5);
  }

  doc.setFillColor(243, 244, 246);
  doc.rect(0, 275, 210, 22, "F");
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text("Computer-generated prescription - AI Clinic Management System", 105, 285, { align: "center" });

  doc.save(`prescription-${patient?.name?.replace(/\s/g, "-")}-${new Date().toISOString().split("T")[0]}.pdf`);
};
