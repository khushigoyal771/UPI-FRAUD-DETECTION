import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useML } from "@/context/MLContext";

const UploadPage: React.FC = () => {
  const { setDatasetFromCSV, dataset, loadSampleDataset } = useML();
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string>("");

  useEffect(() => {
    document.title = "Upload Dataset | UPI Fraud Detection";
  }, []);

  const handleFile = async (file?: File) => {
    if (!file) return;
    setFileName(file.name);
    const text = await file.text();
    await setDatasetFromCSV(text);
  };

  return (
    <div className="grid gap-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Dataset Upload & Preview</h1>
        <p className="text-muted-foreground">Upload a CSV or use the preloaded sample to get started.</p>
      </header>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Upload CSV</CardTitle>
            <CardDescription>Ensure it includes the required columns.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <input
              ref={inputRef}
              type="file"
              accept=".csv"
              className="block w-full text-sm"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            {fileName && <p className="text-sm text-muted-foreground">Selected: {fileName}</p>}
            <div className="flex gap-2">
              <Button variant="hero" onClick={() => inputRef.current?.click()}>Choose File</Button>
              <Button variant="secondary" onClick={loadSampleDataset}>Use Sample Dataset</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dataset (all rows)</CardTitle>
            <CardDescription>Viewing all rows</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto max-h-[360px]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    {["TransactionID","UserID","Amount","Timestamp","Location","DeviceID","TransactionType","FraudLabel"].map(col => (
                      <th key={col} className="py-2 pr-4">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dataset.map((row, i) => (
                    <tr key={i} className="border-b last:border-b-0">
                      <td className="py-2 pr-4">{row.TransactionID}</td>
                      <td className="py-2 pr-4">{row.UserID}</td>
                      <td className="py-2 pr-4">{row.Amount}</td>
                      <td className="py-2 pr-4">{row.Timestamp}</td>
                      <td className="py-2 pr-4">{row.Location}</td>
                      <td className="py-2 pr-4">{row.DeviceID}</td>
                      <td className="py-2 pr-4">{row.TransactionType}</td>
                      <td className="py-2 pr-4">{row.FraudLabel ?? ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UploadPage;
