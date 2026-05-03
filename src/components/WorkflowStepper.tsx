"use client";

import { CheckCircle2, Circle, CircleDashed } from "lucide-react";
import { WorkflowStatus } from "@/lib/types";

type WorkflowStep = "topic" | "theory" | "script" | "storyboard" | "video" | "publish";

interface WorkflowStepperProps {
  activeStep: WorkflowStep;
  onStepSelect: (step: WorkflowStep) => void;
  workflow: Record<WorkflowStep, WorkflowStatus>;
}

const steps: Array<{ id: WorkflowStep; label: string; helper: string }> = [
  { id: "topic", label: "选题", helper: "判断值不值得做" },
  { id: "theory", label: "理论", helper: "确认解释框架" },
  { id: "script", label: "脚本", helper: "改六段文案" },
  { id: "storyboard", label: "分镜", helper: "审画面节奏" },
  { id: "video", label: "短片", helper: "生成视频文件" },
  { id: "publish", label: "分发", helper: "准备四平台" }
];

export function WorkflowStepper({ activeStep, onStepSelect, workflow }: WorkflowStepperProps) {
  return (
    <nav className="workflow-stepper" aria-label="内容生产步骤">
      <div className="shell stepper-shell">
        {steps.map((step, index) => {
          const status = workflow[step.id];
          const isActive = activeStep === step.id;
          const disabled = status === "not-started" && step.id !== "topic" && step.id !== "theory";
          const Icon = status === "approved" ? CheckCircle2 : isActive ? CircleDashed : Circle;

          return (
            <button
              aria-current={isActive ? "step" : undefined}
              className={`stepper-item ${isActive ? "active" : ""} ${status}`}
              disabled={disabled}
              key={step.id}
              onClick={() => onStepSelect(step.id)}
              type="button"
            >
              <span className="step-index">{index + 1}</span>
              <Icon size={18} />
              <span>
                <b>{step.label}</b>
                <small>{step.helper}</small>
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
