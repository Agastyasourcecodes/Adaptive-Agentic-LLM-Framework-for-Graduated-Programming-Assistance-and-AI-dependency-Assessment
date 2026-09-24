import { DiagramFrame, Node, Arrow, Diamond, C } from "./primitives";

export default function FallbackDiagram() {
  return (
    <DiagramFrame
      title="Fig. 3 — Model routing & automatic Qwen fallback"
      viewBox="0 0 900 330"
      caption={
        <>
          Qwen is the default and the universal fallback. A Gemini/Grok request is served by that API only when a key is configured, the provider is
          not in its cool-down window and the call returns non-empty text; otherwise the router serves the request from Qwen and reports
          <code className="mx-1">fallback=true</code> with the reason, which the Workspace displays. Quota/auth failures start a cool-down so an exhausted API is not retried on every request.
        </>
      }
    >
      <Node x={20} y={130} w={120} h={50} kind="io" title="Requested model" sub="Qwen · Gemini · Grok" />
      <Arrow d="M140 155 H150" color="accent" />
      <Diamond cx={200} cy={155} w={100} h={64} lines={["provider", "= Qwen?"]} />

      {/* qwen yes */}
      <Arrow d="M200 123 V55 H290" color="accent" label="yes" lx={186} ly={90} />
      <Node x={290} y={30} w={140} h={50} kind="llm" title="Call Ollama" sub="Qwen (local)" />
      <Arrow d="M430 55 H810 V128" color="accent" />

      {/* no */}
      <Arrow d="M250 155 H292" color="accent" label="no" lx={272} ly={146} />
      <Diamond cx={345} cy={155} w={106} h={70} lines={["key set &", "not cooling?"]} />
      <Arrow d="M398 155 H430" color="accent" label="yes" lx={414} ly={146} />
      <Node x={430} y={130} w={130} h={50} kind="llm" title="Call cloud API" sub="Gemini / Grok · timeout" />
      <Arrow d="M560 155 H590" color="accent" />
      <Diamond cx={640} cy={155} w={100} h={64} lines={["2xx &", "text?"]} />
      <Arrow d="M690 155 H740" color="accent" label="yes" lx={715} ly={146} />
      <Node x={740} y={130} w={140} h={50} kind="io" title="Return response" sub="provider · fallback flag" />

      {/* fallback paths */}
      <Arrow d="M345 190 V240" kind="dashed" color="tan" label="no key / cooling" lx={400} ly={219} />
      <Node x={280} y={240} w={140} h={50} kind="llm" title="Call Ollama" sub="Qwen fallback" />
      <Arrow d="M640 187 V265 H422" kind="dashed" color="tan" label="quota · auth · 5xx · timeout · empty" lx={540} ly={258} />
      <text x="640" y="205" fontSize="10" fill={C.tan} fontStyle="italic" dx="6">no</text>
      <Arrow d="M350 290 V310 H810 V182" kind="dashed" color="tan" label="fallback=true, reason attached" lx={580} ly={324} />
    </DiagramFrame>
  );
}
