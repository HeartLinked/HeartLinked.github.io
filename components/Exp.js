// 经历条目：公司 logo + 公司/团队（左） + 时间（右对齐），下方一行工作内容总结
export default function Exp({ logo, alt, company, team, time, children }) {
  return (
    <div className="exp">
      <div className="exp-head">
        <span className="exp-title">
          {logo && (
            <img src={logo} className="exp-logo" alt={alt || `${company} logo`} />
          )}
          <strong>{company}</strong>
          {team && <span className="exp-team"> · {team}</span>}
        </span>
        <span className="exp-time">{time}</span>
      </div>
      {children && <div className="exp-desc">{children}</div>}
    </div>
  )
}
