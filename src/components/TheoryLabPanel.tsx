"use client";

import { ArrowRight, BookOpen, CheckCircle2, Lightbulb, ShieldCheck } from "lucide-react";
import { ContentThesis, TheoryCard } from "@/lib/types";

interface TheoryLabPanelProps {
  isConfirmed: boolean;
  selectedTheory: TheoryCard;
  theories: TheoryCard[];
  thesis: ContentThesis;
  onConfirm: () => void;
  onSelect: (theoryId: string) => void;
}

export function TheoryLabPanel({ isConfirmed, onConfirm, onSelect, selectedTheory, theories, thesis }: TheoryLabPanelProps) {
  return (
    <section className="work-panel theory-lab">
      <div className="section-heading">
        <div>
          <span className="kicker">03 理论确认</span>
          <h2>把热点变成一个可解释的论点</h2>
        </div>
        <ShieldCheck size={20} />
      </div>
      <div className="theory-layout">
        <div className="theory-options">
          {theories.map((theory) => (
            <button
              className={`theory-card ${theory.id === selectedTheory.id ? "selected" : ""} ${isConfirmed && theory.id === selectedTheory.id ? "confirmed" : ""}`}
              key={theory.id}
              onClick={() => onSelect(theory.id)}
              type="button"
            >
              <div>
                <h3>{theory.name}</h3>
                <span>{isConfirmed && theory.id === selectedTheory.id ? "已确认" : theory.explanatoryPower}</span>
              </div>
              <p>{theory.oneSentence}</p>
              <small>{theory.angle}</small>
            </button>
          ))}
        </div>
        <div className="thesis-board">
          <h3>
            <Lightbulb size={18} />
            今日论点
          </h3>
          <p className="claim">{thesis.coreClaim}</p>
          <div className="thesis-grid">
            <div>
              <b>反对误读</b>
              <p>{thesis.antiMisreading}</p>
            </div>
            <div>
              <b>带走一句话</b>
              <p>{thesis.goldenLine}</p>
            </div>
          </div>
          <div className="theory-notes">
            <NoteList icon={<CheckCircle2 size={15} />} title="常见误读" items={selectedTheory.misreadings} />
            <NoteList icon={<BookOpen size={15} />} title="参考来源" items={selectedTheory.sourceRefs} />
          </div>
          <div className={`confirm-box ${isConfirmed ? "confirmed" : ""}`}>
            <div>
              <b>{isConfirmed ? "理论已确认" : "请选择一个理论后继续"}</b>
              <p>{isConfirmed ? "现在可以进入脚本改稿，检查六段内容是否顺滑。" : "点击左侧理论只是预览；确认后才会推进到下一步。"}</p>
            </div>
            <button className="primary-action" onClick={onConfirm} type="button">
              {isConfirmed ? "重新进入脚本" : "确认这个理论，进入脚本改稿"}
              <ArrowRight size={17} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function NoteList({ icon, items, title }: { icon: React.ReactNode; items: string[]; title: string }) {
  return (
    <div>
      <h4>
        {icon}
        {title}
      </h4>
      {items.slice(0, 2).map((item) => (
        <p key={item}>{item}</p>
      ))}
    </div>
  );
}
