// Nightfall Settings: Account / Connections / Plan & usage / Privacy & data / Legal.
import { Bell, Check, ExternalLink, FileText, Loader2, LockKeyhole, Mail, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { LanguageToggle, usePublicLanguage } from "@/components/LanguageToggle";

type Section = "account" | "connections" | "plan" | "privacy" | "legal";

const copy = {
  en: {
    eyebrow: "YOUR SETTINGS", title: "How Nightfall works for you.",
    nav: { account: "Account", connections: "Connections", plan: "Plan & usage", privacy: "Privacy & data", legal: "Legal" },
    accountTitle: "Signed in as", method: "Sign-in method",
    connectionsTitle: "Connections", connectionsBody: "Bring your own keys and inboxes. Everything sensitive is encrypted under a key unique to your account — deleting your account destroys that key.",
    gmailLabel: "Gmail", gmailBody: "Drafts are prepared here. Nothing sends without your explicit click-to-approve.", connectGmail: "Connect Gmail", disconnectGmail: "Disconnect",
    geminiLabel: "Gemini API key (bring your own)", geminiBody: "Your own key gives you unlimited AI research on any plan. It is sealed with your personal encryption key and never shown again after saving.",
    geminiPlaceholder: "AIza…", saveKey: "Save key", clearKey: "Remove", keySaved: "Key saved ✓", noKey: "No key saved — using the platform key within your plan's daily limit.",
    googleLabel: "Google account", googleConnect: "Sign in with Google to link your account",
    planTitle: "Plan & usage", free: "Free", pro: "Pro", premium: "Premium", current: "Current plan",
    aiLimit: "Platform AI calls / day", programmesCap: "Saved programmes cap", byoNote: "Have your own Gemini key? You are unlimited regardless of plan.",
    privacyTitle: "Privacy & data", exportLabel: "Download my data", exportBody: "Everything Nightfall holds about you, as JSON. Secrets excluded.", exportBtn: "Export JSON",
    deleteLabel: "Delete account", deleteBody: "Hard-deletes every personal record and destroys your encryption key. Sealed data in existing backups becomes permanently unreadable. This cannot be undone.", confirmPrompt: "Type DELETE MY ACCOUNT to confirm", deleteBtn: "Delete my account forever",
    legalTitle: "Legal", terms: "Terms & Conditions", eula: "End User License Agreement", privacyPolicy: "Privacy Policy", view: "View",
  },
  ar: {
    eyebrow: "إعداداتك", title: "كيف بيشتغل نايتفول إلك.",
    nav: { account: "الحساب", connections: "الاتصالات", plan: "الخطة والاستخدام", privacy: "الخصوصية والبيانات", legal: "قانوني" },
    accountTitle: "مسجّل دخول باسم", method: "طريقة الدخول",
    connectionsTitle: "الاتصالات", connectionsBody: "جرّب مفاتيحك وصناديقك الخاصة. كل شي حساس مشفّر بمفتاح خاص فيك — وحذف الحساب بدمّر هالمفتاح.",
    gmailLabel: "غمايل Gmail", gmailBody: "المسودات بتتحضر هون. ما بينبعت شي بدون ضغطة موافقتك الصريحة.", connectGmail: "وصّل Gmail", disconnectGmail: "فصل",
    geminiLabel: "مفتاح Gemini الخاص فيك", geminiBody: "مفتاحك الخاص بيعطيك بحث ذكاء اصطناعي بلا حدود بأي خطة. بينخزّن مشفّر بمفتاحك الشخصي وما منعرضه تاني بعد الحفظ.",
    geminiPlaceholder: "AIza…", saveKey: "احفظ المفتاح", clearKey: "شيل", keySaved: "انحفظ ✓", noKey: "ما في مفتاح محفوظ — عم نستخدم مفتاح المنصة ضمن حد خطتك اليومي.",
    googleLabel: "حساب غوغل", googleConnect: "سجّل بحساب Google لتربط حسابك",
    planTitle: "الخطة والاستخدام", free: "مجانية", pro: "برو", premium: "بريميوم", current: "خطتك الحالية",
    aiLimit: "طلبات الذكاء الاصطناعي / يوم", programmesCap: "حد البرامج المحفوظة", byoNote: "عندك مفتاح Gemini خاص؟ إنت بلا حدود مهما كانت الخطة.",
    privacyTitle: "الخصوصية والبيانات", exportLabel: "نزّل بياناتي", exportBody: "كل شي نايتفول عارفو عنك، بصيغة JSON. بدون الأسرار.", exportBtn: "تصدير JSON",
    deleteLabel: "حذف الحساب", deleteBody: "بينحذف كل سجل شخصي، ويندمّر مفتاح التشفير تبعك. أي بيانات مشفرة بالنسخ الاحتياطية بتصير مستحيلة القراءة للأبد. ما بينرجع رجوع.", confirmPrompt: "اكتب DELETE MY ACCOUNT للتأكيد", deleteBtn: "احذف حسابي للأبد",
    legalTitle: "قانوني", terms: "الشروط والأحكام", eula: "اتفاقية الترخيص", privacyPolicy: "سياسة الخصوصية", view: "عرض",
  },
} as const;

function Mark() { return <span className="grid h-9 w-9 place-items-center border border-white/65"><Sparkles className="h-3.5 w-3.5 fill-white text-white" /></span>; }

export default function StudentSettings() {
  const { user } = useAuth();
  const { language, isArabic, setLanguage } = usePublicLanguage();
  const t = copy[language];
  const [, setLocation] = useLocation();
  const [section, setSection] = useState<Section>("account");
  const [geminiKey, setGeminiKey] = useState("");
  const [confirmText, setConfirmText] = useState("");

  const relationship = trpc.student.universityRelationshipWorkspace.useQuery();
  const geminiStatus = trpc.student.geminiKeyStatus.useQuery();
  const planUsage = trpc.student.planUsage.useQuery();
  const utils = trpc.useUtils();

  const saveKey = trpc.student.saveGeminiApiKey.useMutation({ onSuccess: () => { setGeminiKey(""); void utils.student.geminiKeyStatus.invalidate(); void utils.student.planUsage.invalidate(); } });
  const clearKey = trpc.student.clearGeminiApiKey.useMutation({ onSuccess: () => void utils.student.geminiKeyStatus.invalidate() });
  const disconnectGmail = trpc.student.disconnectStudentGmail.useMutation({ onSuccess: () => void utils.student.universityRelationshipWorkspace.invalidate() });
  const deleteAccount = trpc.student.deleteAccount.useMutation({ onSuccess: () => { setLocation("/"); window.location.href = "/"; } });

  const gmailConnected = Boolean(relationship.data?.inboxConnection);
  const sections: Array<{ id: Section; label: string }> = [
    { id: "account", label: t.nav.account },
    { id: "connections", label: t.nav.connections },
    { id: "plan", label: t.nav.plan },
    { id: "privacy", label: t.nav.privacy },
    { id: "legal", label: t.nav.legal },
  ];

  return <div dir={isArabic ? "rtl" : "ltr"} className="night-bloom min-h-screen text-white">
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-[#0b0d0e]/92 px-5 py-4 backdrop-blur-xl"><button onClick={() => setLocation("/dashboard")} className="flex items-center gap-3 text-left"><Mark /><span><span className="block text-sm font-semibold tracking-[.16em]">NIGHTFALL</span><span className="nf-label mt-1 block text-[8px] text-white/45">{t.eyebrow}</span></span></button><LanguageToggle language={language} onChange={setLanguage} /></header>
    <main className="mx-auto max-w-[1100px] px-5 py-10 sm:px-8">
      <p className="nf-label text-[#9fa9a3]">// {t.eyebrow}</p>
      <h1 className="mt-4 max-w-2xl text-5xl font-semibold leading-[.9] tracking-[-.06em]">{t.title}</h1>
      <div className="mt-10 grid gap-8 lg:grid-cols-[220px_1fr]">
        <nav className="flex gap-1 overflow-x-auto lg:flex-col">{sections.map((item) => <button key={item.id} onClick={() => setSection(item.id)} className={`whitespace-nowrap border-l-2 px-4 py-3 text-left text-sm ${section === item.id ? "border-white bg-white/[.05] font-semibold text-white" : "border-transparent text-[#9ca79f] hover:text-white"}`}>{item.label}</button>)}</nav>

        {section === "account" && <section className="space-y-4"><p className="nf-label text-[#9ba59f]">// {t.nav.account}</p><h2 className="text-xl font-semibold">{t.accountTitle}</h2><div className="border border-white/12 bg-white/[.02] p-5"><p className="text-lg font-semibold text-white">{user?.name || "—"}</p><p className="mt-1 text-sm text-[#a6b0a9]">{user?.email || "—"}</p><p className="nf-label mt-4 text-[8px] text-[#8e9992]">{t.method}</p><p className="text-xs uppercase tracking-wider text-[#cfd6d1]">{user?.loginMethod === "google" ? "Google" : user?.loginMethod === "password" ? "Email + password" : "—"}</p></div></section>}

        {section === "connections" && <section className="space-y-5"><p className="nf-label text-[#9ba59f]">// {t.nav.connections}</p><h2 className="text-xl font-semibold">{t.connectionsTitle}</h2><p className="max-w-xl text-sm leading-6 text-[#a6b0a9]">{t.connectionsBody}</p>
          <div className="grid grid-cols-[1fr_auto] items-start gap-5 border border-white/12 bg-white/[.02] p-5"><div><p className="flex items-center gap-2 text-sm font-semibold text-white"><Mail className="h-4 w-4" />{t.gmailLabel}</p><p className="mt-2 text-xs leading-5 text-[#a6b0a9]">{gmailConnected ? `${t.gmailBody} (${relationship.data?.inboxConnection?.emailAddress})` : t.gmailBody}</p></div>{relationship.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : gmailConnected ? <button onClick={() => disconnectGmail.mutate()} disabled={disconnectGmail.isPending} className="nf-button border border-white/25 px-4 py-2.5 text-[10px] font-bold uppercase tracking-[.08em] hover:border-white">{t.disconnectGmail}</button> : <a href="/api/gmail/connect" className="nf-button border border-white bg-white px-4 py-2.5 text-[10px] font-bold uppercase tracking-[.08em] text-black">{t.connectGmail}</a>}</div>
          <div className="border border-white/12 bg-white/[.02] p-5"><p className="flex items-center gap-2 text-sm font-semibold text-white"><LockKeyhole className="h-4 w-4" />{t.geminiLabel}</p><p className="mt-2 text-xs leading-5 text-[#a6b0a9]">{t.geminiBody}</p>{geminiStatus.data?.hasKey ? <div className="mt-4 flex items-center gap-3"><span className="inline-flex items-center gap-2 text-xs text-emerald-300"><Check className="h-4 w-4" />{t.keySaved}</span><button onClick={() => clearKey.mutate()} disabled={clearKey.isPending} className="nf-button text-[10px] underline">{t.clearKey}</button></div> : <div className="mt-4 flex flex-wrap gap-2"><input type="password" value={geminiKey} onChange={(event) => setGeminiKey(event.target.value)} placeholder={t.geminiPlaceholder} className="min-w-0 flex-1 border border-white/15 bg-black/20 px-4 py-3 text-sm outline-none placeholder:text-white/30" /><button onClick={() => geminiKey.trim().length >= 10 && saveKey.mutate({ apiKey: geminiKey.trim() })} disabled={saveKey.isPending || geminiKey.trim().length < 10} className="nf-button border border-white bg-white px-4 py-3 text-[10px] font-bold uppercase tracking-[.08em] text-black disabled:opacity-50">{saveKey.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t.saveKey}</button></div>}{!geminiStatus.data?.hasKey && <p className="mt-3 text-xs text-[#849088]">{t.noKey}</p>}</div>
        </section>}

        {section === "plan" && <section className="space-y-5"><p className="nf-label text-[#9ba59f]">// {t.nav.plan}</p><h2 className="text-xl font-semibold">{t.planTitle}</h2><div className="grid gap-3 sm:grid-cols-3">{(["free", "pro", "premium"] as const).map((tier) => { const active = planUsage.data?.plan === tier; const limits = planUsage.data?.limits as Record<string, { platformAiCallsPerDay: number; savedProgrammesCap: number }> | undefined; return <div key={tier} className={`border p-5 ${active ? "border-white bg-white/[.06]" : "border-white/12 bg-white/[.02]"}`}>{active && <span className="nf-label mb-3 block text-[8px] text-emerald-300">{t.current}</span>}<p className="text-lg font-semibold capitalize">{t[tier]}</p><ul className="mt-3 space-y-1.5 text-xs leading-5 text-[#a6b0a9]"><li>{t.aiLimit}: <b className="text-white">{limits?.[tier]?.platformAiCallsPerDay ?? "—"}</b></li><li>{t.programmesCap}: <b className="text-white">{limits?.[tier]?.savedProgrammesCap ?? "—"}</b></li></ul></div>; })}</div><p className="text-xs leading-5 text-[#849088]">{t.byoNote}</p></section>}

        {section === "privacy" && <section className="space-y-5"><p className="nf-label text-[#9ba59f]">// {t.nav.privacy}</p><h2 className="text-xl font-semibold">{t.privacyTitle}</h2>
          <div className="border border-white/12 bg-white/[.02] p-5"><p className="flex items-center gap-2 text-sm font-semibold text-white"><FileText className="h-4 w-4" />{t.exportLabel}</p><p className="mt-2 text-xs leading-5 text-[#a6b0a9]">{t.exportBody}</p><ExportButton label={t.exportBtn} /></div>
          <div className="border border-red-500/25 p-5"><p className="flex items-center gap-2 text-sm font-semibold text-red-300"><Trash2 className="h-4 w-4" />{t.deleteLabel}</p><p className="mt-2 text-xs leading-5 text-[#d9dfda]">{t.deleteBody}</p><input value={confirmText} onChange={(event) => setConfirmText(event.target.value)} placeholder={t.confirmPrompt} className="mt-4 w-full max-w-md border border-white/15 bg-black/20 px-4 py-3 text-sm outline-none placeholder:text-white/30" /><button onClick={() => deleteAccount.mutate({ confirmText: confirmText as "DELETE MY ACCOUNT" })} disabled={confirmText !== "DELETE MY ACCOUNT" || deleteAccount.isPending} className="mt-3 block w-full max-w-md border border-red-400/60 px-4 py-3 text-[10px] font-bold uppercase tracking-[.08em] text-red-200 enabled:hover:bg-red-500/10 disabled:opacity-40">{deleteAccount.isPending ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : t.deleteBtn}</button></div>
        </section>}

        {section === "legal" && <section className="space-y-4"><p className="nf-label text-[#9ba59f]">// {t.nav.legal}</p><h2 className="text-xl font-semibold">{t.legalTitle}</h2>{([["terms", t.terms], ["eula", t.eula], ["privacy", t.privacyPolicy]] as const).map(([doc, label]) => <a key={doc} href={`/legal/${doc}`} target="_blank" rel="noreferrer" className="flex items-center justify-between border border-white/12 bg-white/[.02] p-5 text-sm text-white hover:border-white"><span>{label}</span><ExternalLink className="h-4 w-4 text-[#929d96]" /></a>)}</section>}
      </div>
    </main>
  </div>;
}

function ExportButton({ label }: { label: string }) {
  const data = trpc.student.exportData.useQuery(undefined, { enabled: false });
  return <button
    onClick={async () => {
      const result = await data.refetch();
      if (!result.data) return;
      const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `nightfall-export-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
    }}
    className="mt-4 inline-block border border-white bg-white px-4 py-2.5 text-[10px] font-bold uppercase tracking-[.08em] text-black"
  >{label}</button>;
}
