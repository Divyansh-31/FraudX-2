import { useState, useCallback } from "react";
import { Upload, BrainCircuit, Image as ImageIcon, X, Sparkles, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/DashboardLayout";
import { RiskBadge } from "@/components/RiskBadge";
import { mlAnalysisLogs } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const MLModels = () => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      setUploadedFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setUploadedFile(e.target.files[0]);
    }
  }, []);

  return (
    <DashboardLayout>
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">
        <motion.div variants={item}>
          <h1 className="text-xl font-bold text-foreground tracking-tight">ML Analysis</h1>
          <p className="text-xs text-muted-foreground mt-1">Upload images for AI-powered fraud detection</p>
        </motion.div>

        {/* Stats Row */}
        <motion.div variants={item} className="grid grid-cols-3 gap-3">
          <div className="glass-card glass-card-hover rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <BrainCircuit className="h-4 w-4 text-primary" />
              </div>
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Total Analyses</span>
            </div>
            <p className="text-2xl font-bold text-foreground">1,247</p>
          </div>
          <div className="glass-card glass-card-hover rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-destructive/10">
                <Sparkles className="h-4 w-4 text-destructive" />
              </div>
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Threats Found</span>
            </div>
            <p className="text-2xl font-bold text-foreground">89</p>
          </div>
          <div className="glass-card glass-card-hover rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-success/10">
                <BarChart3 className="h-4 w-4 text-success" />
              </div>
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Accuracy</span>
            </div>
            <p className="text-2xl font-bold text-foreground">97.8%</p>
          </div>
        </motion.div>

        {/* Upload Zone */}
        <motion.div variants={item}>
          <div
            className={cn(
              "glass-card rounded-2xl p-8 border-dashed border-2 cursor-pointer transition-all duration-300",
              dragActive
                ? "border-primary bg-primary/5 glow-blue"
                : "border-border/30 hover:border-border/60 hover:bg-accent/20"
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => document.getElementById("file-upload")?.click()}
          >
            <input
              id="file-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileInput}
            />
            <div className="flex flex-col items-center justify-center text-center gap-3">
              <div className="p-3 rounded-xl bg-secondary/60 border border-border/30">
                <Upload className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {uploadedFile ? uploadedFile.name : "Drop image here or click to upload"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  JPG, PNG, WEBP — Max 20MB
                </p>
              </div>
              {uploadedFile && (
                <div className="flex items-center gap-2 mt-2">
                  <Button size="sm" className="gap-1.5 text-xs h-8 rounded-lg">
                    <BrainCircuit className="h-3.5 w-3.5" />
                    Analyze
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      setUploadedFile(null);
                    }}
                    className="h-8 w-8 p-0 rounded-lg"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* ML Analysis Table */}
        <motion.div variants={item}>
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border/30">
              <h2 className="text-sm font-semibold text-foreground">Analysis Logs</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">Real-time AI detection output</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/20">
                    <th className="text-left px-5 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">ID</th>
                    <th className="text-left px-3 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">User</th>
                    <th className="text-left px-3 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Image</th>
                    <th className="text-left px-3 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Result</th>
                    <th className="text-left px-3 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Confidence</th>
                    <th className="text-left px-3 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Risk</th>
                    <th className="text-left px-3 py-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {mlAnalysisLogs.map((log) => (
                    <tr key={log.id} className="border-b border-border/10 hover:bg-accent/30 transition-colors">
                      <td className="px-5 py-3">
                        <span className="text-xs font-mono text-primary">{log.id}</span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                            {log.userName.split(" ").map((n) => n[0]).join("")}
                          </div>
                          <span className="text-xs font-medium text-foreground">{log.userName}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="h-8 w-8 rounded-lg border border-border/30 bg-secondary/40 flex items-center justify-center">
                          <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={cn(
                            "text-xs font-semibold",
                            log.inferenceResult === "AI-Generated" && "text-destructive",
                            log.inferenceResult === "Tampered" && "text-destructive",
                            log.inferenceResult === "Suspicious" && "text-warning",
                            log.inferenceResult === "Authentic" && "text-success"
                          )}
                        >
                          {log.inferenceResult}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className="font-mono text-xs text-muted-foreground">{log.confidenceScore}%</span>
                      </td>
                      <td className="px-3 py-3">
                        <RiskBadge score={log.riskScore} />
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-[11px] text-muted-foreground font-mono">{log.timestamp}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
};

export default MLModels;
