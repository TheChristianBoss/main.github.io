import assert from "node:assert/strict";

import { generateTemplate } from "../src/engine/generateTemplate.js";
import { stripBrackets } from "../src/utils/resumeText.js";
import { normalizeKeyword, rewriteBullet, scoreResume } from "../src/utils/resumeUtils.js";

const resume = [
  "Jordan Smith",
  "jordan@example.com | (555) 123-4567",
  "Professional Summary",
  "Software engineer with React, JavaScript, SQL, Git, and API experience.",
  "Experience",
  "- Built a React dashboard that reduced reporting time by 25%.",
  "Skills",
  "JavaScript, React, SQL, Git, REST API",
].join("\n");

const analysis = scoreResume(
  resume,
  "Software Engineer",
  "Seeking a software engineer with JavaScript, React, SQL, Git, and REST API experience."
);
assert.ok(analysis, "ATS analysis should return a result");
assert.equal(typeof analysis.score, "number");
assert.ok(analysis.score >= 0 && analysis.score <= 100, "ATS score should remain within its documented range");

const template = generateTemplate({ name: "Jordan Smith" }, "Software Engineer", "Technology & IT");
assert.match(template.summary, /Software Engineer/i);
assert.match(template.experience, /Company Name/);
assert.ok(template.skills.length > 20);

assert.equal(
  stripBrackets("Keep this line\nRemove [placeholder] line\n•\nFinal line"),
  "Keep this line\nFinal line"
);
assert.equal(normalizeKeyword("React.js"), "react");
assert.match(normalizeKeyword("REST APIs"), /rest api/);
assert.match(rewriteBullet("helped build a dashboard"), /build a dashboard/i);
assert.notEqual(rewriteBullet("helped build a dashboard"), "helped build a dashboard");

console.log("Application smoke tests passed.");
