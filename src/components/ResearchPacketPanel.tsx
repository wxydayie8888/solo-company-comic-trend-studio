import { ChevronRight, FileSearch } from "lucide-react";
import { HotTopic, ResearchPacket } from "@/lib/types";

interface ResearchPacketPanelProps {
  packet: ResearchPacket;
  topic: HotTopic;
}

export function ResearchPacketPanel({ packet, topic }: ResearchPacketPanelProps) {
  return (
    <section className="work-panel research-panel">
      <div className="section-heading">
        <div>
          <span className="kicker">02 研究包</span>
          <h2>先把事实边界说清楚</h2>
        </div>
        <a className="source-link" href={topic.sourceUrl} rel="noreferrer" target="_blank">
          {topic.sourceLabel}
          <ChevronRight size={15} />
        </a>
      </div>
      <p className="summary">{packet.factSummary}</p>
      <div className="timeline">
        {packet.timeline.map((item) => (
          <div className="timeline-item" key={`${item.time}-${item.event}`}>
            <span>{item.time}</span>
            <p>{item.event}</p>
          </div>
        ))}
      </div>
      <div className="research-grid">
        <InfoBlock title="关键争议" items={packet.debates} />
        <InfoBlock title="不同立场" items={packet.perspectives} />
        <InfoBlock title="不能说" items={packet.cannotSay} tone="warn" />
        <InfoBlock title="不确定信息" items={packet.uncertainties} tone="muted" />
      </div>
    </section>
  );
}

function InfoBlock({ items, title, tone = "default" }: { items: string[]; title: string; tone?: "default" | "warn" | "muted" }) {
  return (
    <div className={`info-block ${tone}`}>
      <h3>
        <FileSearch size={15} />
        {title}
      </h3>
      {items.map((item) => (
        <p key={item}>{item}</p>
      ))}
    </div>
  );
}
