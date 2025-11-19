import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Download, FileText, FileSpreadsheet, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

interface ExportReportsProps {
  data: any[];
  title: string;
  variant?: 'default' | 'icon';
  chartId?: string; // ID of the chart container to capture
}

const ExportReports: React.FC<ExportReportsProps> = ({ data, title, variant = 'default', chartId }) => {
  const [isExporting, setIsExporting] = useState(false);

  const exportToPDF = async () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      let yPosition = 25;
      
      // Header
      doc.setFontSize(20);
      doc.setTextColor(138, 43, 226);
      doc.text('UPI Fraud Detection Report', 20, yPosition);
      yPosition += 15;
      
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text(title, 20, yPosition);
      yPosition += 10;
      
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, yPosition);
      yPosition += 8;
      doc.text(`Total Records: ${data.length}`, 20, yPosition);
      yPosition += 15;
      
      // Capture chart if chartId is provided
      if (chartId) {
        const chartElement = document.getElementById(chartId);
        if (chartElement) {
          try {
            const canvas = await html2canvas(chartElement, {
              backgroundColor: '#ffffff',
              scale: 2,
              logging: false,
              useCORS: true
            });
            
            const chartImage = canvas.toDataURL('image/png');
            const imgWidth = 170;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            // Add chart image to PDF
            doc.addImage(chartImage, 'PNG', 20, yPosition, imgWidth, imgHeight);
            yPosition += imgHeight + 10;
            
            // If we're near the bottom, add new page
            if (yPosition > 250) {
              doc.addPage();
              yPosition = 20;
            }
          } catch (error) {
            console.error('Error capturing chart:', error);
          }
        }
      }
      
      // Summary stats
      if (data.length > 0 && data[0].hasOwnProperty('FraudLabel')) {
        const fraudCount = data.filter(item => item.FraudLabel === 1).length;
        const fraudRate = ((fraudCount / data.length) * 100).toFixed(2);
        
        doc.setFontSize(12);
        doc.text('Summary Statistics:', 20, yPosition);
        yPosition += 10;
        doc.setFontSize(10);
        doc.text(`• Total Transactions: ${data.length.toLocaleString()}`, 25, yPosition);
        yPosition += 8;
        doc.text(`• Fraud Cases: ${fraudCount.toLocaleString()}`, 25, yPosition);
        yPosition += 8;
        doc.text(`• Fraud Rate: ${fraudRate}%`, 25, yPosition);
        yPosition += 8;
        doc.text(`• Clean Transactions: ${(data.length - fraudCount).toLocaleString()}`, 25, yPosition);
        yPosition += 15;
      }
      
      // Data table
      if (data.length > 0) {
        const sampleData = data.slice(0, 50);
        const headers = Object.keys(sampleData[0]);
        
        const tableData = sampleData.map(item => 
          headers.map(header => {
            if (header === 'Amount') return `₹${Number(item[header]).toLocaleString()}`;
            if (header === 'Timestamp') return new Date(item[header]).toLocaleDateString();
            if (header === 'FraudLabel') return item[header] === 1 ? 'Fraud' : 'Clean';
            return item[header]?.toString() || 'N/A';
          })
        );
        
        autoTable(doc, {
          head: [headers],
          body: tableData,
          startY: yPosition,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [138, 43, 226] },
          alternateRowStyles: { fillColor: [240, 240, 240] },
        });
      }
      
      doc.save(`${title.replace(/\s+/g, '_')}_Report_${new Date().getTime()}.pdf`);
      
      toast.success("PDF report with chart exported successfully!", {
        icon: <CheckCircle className="w-4 h-4 text-green-500" />
      });
    } catch (error) {
      console.error('Export error:', error);
      toast.error("Failed to export PDF");
    } finally {
      setIsExporting(false);
    }
  };

  const exportToCSV = async () => {
    setIsExporting(true);
    try {
      if (data.length === 0) {
        toast.error("No data to export");
        return;
      }
      
      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(','),
        ...data.map(row => 
          headers.map(header => {
            const value = row[header];
            return typeof value === 'string' ? `"${value}"` : value;
          }).join(',')
        )
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title.replace(/\s+/g, '_')}_Data_${new Date().getTime()}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      toast.success("CSV data exported successfully!", {
        icon: <CheckCircle className="w-4 h-4 text-green-500" />
      });
    } catch (error) {
      toast.error("Failed to export CSV");
    } finally {
      setIsExporting(false);
    }
  };

  if (variant === 'icon') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="icon"
            disabled={isExporting || data.length === 0}
            className="h-9 w-9 border-primary/20 hover:bg-primary/5"
          >
            <Download className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={exportToPDF} disabled={isExporting}>
            <FileText className="h-4 w-4 mr-2 text-red-500" />
            Export as PDF
          </DropdownMenuItem>
          <DropdownMenuItem onClick={exportToCSV} disabled={isExporting}>
            <FileSpreadsheet className="h-4 w-4 mr-2 text-green-500" />
            Export as CSV
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline"
          disabled={isExporting || data.length === 0}
          className="border-primary/20 hover:bg-primary/5"
        >
          {isExporting ? (
            <>
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Export Reports
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={exportToPDF} disabled={isExporting}>
          <FileText className="h-4 w-4 mr-2 text-red-500" />
          📄 Export Full Report (PDF)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToCSV} disabled={isExporting}>
          <FileSpreadsheet className="h-4 w-4 mr-2 text-green-500" />
          📊 Export Data (CSV)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ExportReports;