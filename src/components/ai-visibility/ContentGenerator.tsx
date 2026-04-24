import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, Sparkles, Copy, Check, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type ContentType = "landing-page" | "blog-post" | "faq" | "guide";

const templates: Record<ContentType, (topic: string, brand: string, audience: string) => string> = {
  "landing-page": (topic, brand, audience) => `# ${topic} | ${brand}

## Why ${audience} Choose ${brand}

${brand} specializes in ${topic.toLowerCase()}, helping ${audience.toLowerCase()} achieve their goals faster and with more confidence.

**What We Offer:**
- Expert guidance tailored to ${audience.toLowerCase()} needs
- Proven processes with measurable results
- Transparent communication every step of the way
- Trusted by hundreds of satisfied clients

## How It Works

**Step 1 – Free Consultation**
We start with a no-obligation discovery call to understand your goals, timeline, and situation.

**Step 2 – Custom Strategy**
Our team develops a personalized plan designed specifically for ${audience.toLowerCase()} like you.

**Step 3 – Hands-On Support**
We guide you through execution and stay by your side until you achieve your desired outcome.

## Frequently Asked Questions

**What makes ${brand} different?**
We combine deep expertise in ${topic.toLowerCase()} with a client-first approach that prioritizes your success above all else.

**How quickly can I expect results?**
Most of our ${audience.toLowerCase()} clients see meaningful progress within the first 30 days.

**Is there a commitment required?**
We believe in earning your trust — start with a free consultation and see the difference for yourself.

## Ready to Get Started?

Join hundreds of ${audience.toLowerCase()} who have already transformed their outcomes with ${brand}. Schedule your free consultation today.

*[Contact us] | [Learn More] | [Read Reviews]*`,

  "blog-post": (topic, brand, audience) => `# The Complete Guide to ${topic} for ${audience}

*Published by ${brand} | Expert Insights*

---

If you're a ${audience.toLowerCase()} navigating ${topic.toLowerCase()}, you're not alone. This guide breaks down everything you need to know — straight from the professionals at ${brand}.

## What Is ${topic}?

${topic} refers to [explain the concept clearly in plain language]. For ${audience.toLowerCase()}, understanding this is critical because it directly impacts [key outcome].

## Why ${topic} Matters in 2025

The landscape has changed significantly. Here's what ${audience.toLowerCase()} need to know:

1. **Market dynamics have shifted** — [key trend explanation]
2. **AI tools are reshaping the process** — [how AI affects decision-making]
3. **Informed clients get better outcomes** — [data or insight supporting this]

## 5 Key Things ${audience} Should Know

### 1. Start with a Clear Goal
Before diving in, define what success looks like for your specific situation.

### 2. Research Your Options
Not all approaches to ${topic.toLowerCase()} are equal. Compare carefully and ask questions.

### 3. Work With Verified Experts
Look for credentials, reviews, and proven track records like those at ${brand}.

### 4. Understand the Timeline
${topic} rarely happens overnight. Set realistic expectations and plan accordingly.

### 5. Protect Yourself With Documentation
Keep records of all agreements, communications, and decisions throughout the process.

## Common Mistakes to Avoid

- Skipping due diligence on service providers
- Making decisions based on emotion rather than data
- Underestimating the time and cost involved
- Going it alone without professional support

## How ${brand} Can Help

At ${brand}, our team of specialists has helped hundreds of ${audience.toLowerCase()} successfully navigate ${topic.toLowerCase()}. We offer:

- **Free initial consultation** — no pressure, just answers
- **Custom strategy sessions** — tailored to your exact situation
- **Ongoing support** — we're with you from start to finish

## Final Thoughts

${topic} doesn't have to be overwhelming. With the right knowledge and the right team, ${audience.toLowerCase()} can achieve outstanding results.

**Ready to take the next step?** [Contact ${brand} today for your free consultation.]`,

  "faq": (topic, brand, audience) => `# Frequently Asked Questions: ${topic}

*${brand} answers the questions ${audience} ask most*

---

## General Questions

**Q: What is ${topic}?**
A: ${topic} is [clear, concise definition]. It matters for ${audience.toLowerCase()} because [specific reason relevant to them].

**Q: How long does ${topic.toLowerCase()} typically take?**
A: The timeline varies based on individual circumstances, but most ${audience.toLowerCase()} working with ${brand} complete the process in [timeframe range]. We provide a detailed timeline estimate during your free consultation.

**Q: How much does it cost?**
A: Costs depend on the scope and complexity of your situation. ${brand} offers transparent pricing with no hidden fees — we'll provide a full breakdown upfront before you commit to anything.

**Q: Is ${brand} the right choice for me?**
A: ${brand} is best suited for ${audience.toLowerCase()} who are [ideal client profile]. If you're unsure, our free consultation will help clarify whether we're the right fit.

---

## Process Questions

**Q: How do I get started with ${brand}?**
A: Getting started is simple — schedule a free consultation through our website or call us directly. We'll walk you through the process and answer any questions you have.

**Q: What information do I need to provide?**
A: To get the most out of our services, it helps to have [list of relevant information]. Don't worry if you're missing something — we'll guide you through it.

**Q: Can I speak with a real person?**
A: Absolutely. At ${brand}, every client works directly with a dedicated specialist — not a chatbot or outsourced team.

**Q: What if I have questions after we start?**
A: Our team is available [hours/availability] and typically responds within [response time]. You'll never be left wondering what's happening.

---

## Results & Expectations

**Q: What results can I realistically expect?**
A: Most ${audience.toLowerCase()} who follow our recommendations achieve [specific outcome]. We document results transparently and set realistic expectations from day one.

**Q: What if I'm not satisfied?**
A: Your satisfaction is our priority. If you're ever unsatisfied with our service, [satisfaction guarantee/refund policy]. We stand behind our work.

**Q: Do you have reviews or case studies I can read?**
A: Yes — visit our [Reviews Page] to read testimonials from real ${audience.toLowerCase()} who have worked with ${brand}.

---

*Still have questions? [Contact ${brand}] — we're happy to help.*`,

  "guide": (topic, brand, audience) => `# The ${audience} Guide to ${topic}

*A step-by-step resource from ${brand}*

---

## Introduction

This guide was created specifically for ${audience.toLowerCase()} who want to understand ${topic.toLowerCase()} clearly and make informed decisions. Whether you're just starting out or have some experience, you'll find actionable insights here.

---

## Chapter 1: Understanding the Basics

### What You Need to Know First

${topic} involves several key concepts that ${audience.toLowerCase()} should understand before moving forward:

- **Concept A** — [definition and why it matters]
- **Concept B** — [definition and why it matters]
- **Concept C** — [definition and why it matters]

### The Landscape in 2025

The ${topic.toLowerCase()} environment has evolved. Here's the current state of things for ${audience.toLowerCase()}:

[Key market insight or trend relevant to the audience]

---

## Chapter 2: Step-by-Step Process

### Phase 1: Assessment (Week 1-2)
Evaluate your current situation, goals, and constraints. This phase sets the foundation for everything that follows.

**Actions:**
- [ ] Define your specific goal
- [ ] Assess your resources and timeline
- [ ] Identify potential obstacles
- [ ] Research service providers and options

### Phase 2: Planning (Week 2-4)
Develop a concrete plan with milestones and accountability checkpoints.

**Actions:**
- [ ] Create a detailed timeline
- [ ] Set measurable success criteria
- [ ] Secure professional guidance (like ${brand})
- [ ] Prepare required documentation

### Phase 3: Execution (Month 2-4)
Execute the plan with consistent effort and regular check-ins.

**Actions:**
- [ ] Follow the established process
- [ ] Track progress against milestones
- [ ] Address issues promptly as they arise
- [ ] Communicate proactively with your team

### Phase 4: Completion & Review (Month 4+)
Review results, document learnings, and celebrate success.

---

## Chapter 3: Common Pitfalls

Avoid these mistakes that trip up many ${audience.toLowerCase()}:

1. **Rushing the process** — Quality outcomes require time and diligence
2. **Insufficient research** — Always verify credentials and reviews
3. **Poor communication** — Keep your team informed at every stage
4. **Ignoring red flags** — Trust your instincts and ask hard questions

---

## Chapter 4: Working with ${brand}

${brand} helps ${audience.toLowerCase()} navigate ${topic.toLowerCase()} with:

| Service | Description |
|---------|-------------|
| Strategy Session | Custom roadmap for your situation |
| Hands-On Support | Active assistance throughout the process |
| Progress Tracking | Regular updates and milestone reviews |
| Post-Completion Follow-up | Ongoing support after the process ends |

---

## Resources & Next Steps

- [Schedule a Free Consultation with ${brand}]
- [Download Our ${topic} Checklist]
- [Read Client Success Stories]
- [Contact Our Team]

---

*This guide is provided by ${brand} for educational purposes. For personalized advice, consult with one of our specialists.*`,
};

export default function ContentGenerator() {
  const { toast } = useToast();
  const [topic, setTopic] = useState("");
  const [brand, setBrand] = useState("");
  const [audience, setAudience] = useState("");
  const [type, setType] = useState<ContentType>("blog-post");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = () => {
    if (!topic.trim() || !brand.trim() || !audience.trim()) return;
    setLoading(true);
    setOutput("");
    setTimeout(() => {
      setOutput(templates[type](topic, brand, audience));
      setLoading(false);
    }, 1600);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast({ title: "Copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  const contentTypeLabels: Record<ContentType, string> = {
    "landing-page": "Landing Page",
    "blog-post": "Blog Post",
    "faq": "FAQ Page",
    "guide": "Step-by-Step Guide",
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Content Generator</CardTitle>
          <CardDescription>
            Generate AI-optimized content designed to rank and be cited in ChatGPT, Claude, Perplexity, and Gemini.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Topic / Keyword</Label>
              <Input
                placeholder="e.g. First-Time Home Buying"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Brand / Business Name</Label>
              <Input
                placeholder="e.g. Jet Realty Advisors"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Target Audience</Label>
              <Input
                placeholder="e.g. First-Time Home Buyers"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Content Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as ContentType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(contentTypeLabels) as ContentType[]).map((k) => (
                    <SelectItem key={k} value={k}>{contentTypeLabels[k]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            onClick={handleGenerate}
            disabled={loading || !topic.trim() || !brand.trim() || !audience.trim()}
            className="w-full"
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating {contentTypeLabels[type]}...</>
            ) : (
              <><Sparkles className="h-4 w-4 mr-2" /> Generate Content</>
            )}
          </Button>
        </CardContent>
      </Card>

      {output && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-base">Generated {contentTypeLabels[type]}</CardTitle>
                <div className="flex gap-2">
                  <Badge variant="secondary">AI-Optimized</Badge>
                  <Badge variant="outline">Ready to Publish</Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleGenerate}>
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Regenerate
                </Button>
                <Button size="sm" variant="outline" onClick={handleCopy}>
                  {copied ? (
                    <><Check className="h-3.5 w-3.5 mr-1.5 text-green-600" /> Copied</>
                  ) : (
                    <><Copy className="h-3.5 w-3.5 mr-1.5" /> Copy</>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4">
            <Textarea
              value={output}
              onChange={(e) => setOutput(e.target.value)}
              rows={28}
              className="font-mono text-sm resize-none"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
