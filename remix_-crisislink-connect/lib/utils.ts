import { jsPDF } from 'jspdf';

export function cn(...classes: (string | undefined | null | boolean)[]) {
  return classes.filter(Boolean).join(' ');
}

export function formatDateTime(date: string) {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getSeverityColor(severity: string) {
  switch (severity.toLowerCase()) {
    case 'critical': return 'bg-[#D92128] text-white';
    case 'high': return 'bg-orange-600 text-white';
    case 'medium': return 'bg-[#FFCC00] text-[#002147]';
    case 'low': return 'bg-[#002147] text-white';
    default: return 'bg-slate-500 text-white';
  }
}

export function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case 'active': return 'bg-green-100 text-green-800 border-green-200';
    case 'reported': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'resolved': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'verifying': return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'on_mission': return 'bg-[#002147] text-white border-[#002147]';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

/**
 * Calculates distance between two coordinates in kilometers using Haversine formula.
 */
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c;
};

/**
 * Tactical Download: Institutional Guide Synthesis
 * Generates the official CrisisLink SOP Manual as a professional PDF.
 */
export function downloadInstitutionalGuide() {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Header Section
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(0, 33, 71); // CrisisLink Blue #002147
  doc.text("CRISISLINK CONNECT", pageWidth / 2, yPos, { align: "center" });
  
  yPos += 10;
  doc.setFontSize(14);
  doc.setTextColor(217, 33, 40); // CrisisLink Red #D92128
  doc.text("NATIONAL OPERATIONAL PROTOCOL (SOP)", pageWidth / 2, yPos, { align: "center" });

  yPos += 5;
  doc.setDrawColor(200, 200, 200);
  doc.line(20, yPos, pageWidth - 20, yPos);

  yPos += 15;
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`VERSION: 2025.1.STRATEGIC | ISSUED: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPos, { align: "center" });

  // 1. Mission Objective
  yPos += 20;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(0, 33, 71);
  doc.text("1. MISSION OBJECTIVE", 20, yPos);
  
  yPos += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  const missionText = "To establish a unified, AI-verified communication framework for national disaster resilience, connecting community reporting nodes with institutional responders.";
  const missionLines = doc.splitTextToSize(missionText, pageWidth - 40);
  doc.text(missionLines, 20, yPos);
  yPos += missionLines.length * 6;

  // 2. Core Operational Phases
  yPos += 10;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 33, 71);
  doc.text("2. CORE OPERATIONAL PHASES", 20, yPos);
  
  const phases = [
    "PHASE 01: DETECTION - Satellite imagery and sensor monitoring.",
    "PHASE 02: VERIFICATION - AI analysis of civilian reports.",
    "PHASE 03: MOBILIZATION - Strategic personnel allocation.",
    "PHASE 04: RESPONSE - On-site execution and SitRep updates."
  ];
  
  yPos += 7;
  doc.setFont("helvetica", "normal");
  phases.forEach(phase => {
    doc.text(`• ${phase}`, 25, yPos);
    yPos += 7;
  });

  // 3. Command Structure
  yPos += 10;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 33, 71);
  doc.text("3. COMMAND STRUCTURE", 20, yPos);
  
  const structure = [
    "Administrator: HQ Oversight and Personnel Allocation.",
    "Coordinator: Regional Deployment and Resource Routing.",
    "Resource Manager: Hub Inventory and Logistics Sorties.",
    "Volunteer: Field Intel and Mission Execution.",
    "Community: Primary Hazard Reporting."
  ];

  yPos += 7;
  doc.setFont("helvetica", "normal");
  structure.forEach(item => {
    doc.text(`• ${item}`, 25, yPos);
    yPos += 7;
  });

  // 4. Helpline Directory
  yPos += 10;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 33, 71);
  doc.text("4. HELPLINE DIRECTORY", 20, yPos);
  
  yPos += 7;
  doc.setFont("helvetica", "normal");
  doc.text("National Control: 1070", 25, yPos);
  yPos += 7;
  doc.text("NDRF Response: 1078", 25, yPos);
  yPos += 7;
  doc.text("Medical Support: 102", 25, yPos);

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text("CONFIDENTIAL: FOR AUTHORIZED RESPONDERS ONLY", pageWidth / 2, doc.internal.pageSize.getHeight() - 15, { align: "center" });
  doc.text("Generated by CrisisLink Command Node", pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: "center" });

  // Download Trigger
  doc.save('CRISISLINK_OPERATIONAL_MANUAL_SOP.pdf');
}