import React, { useState } from 'react';
import { Screen, Section, Card, T, Field, Button, Chip, Row, toast } from '@/components/ui';
import { useApp } from '@/store/useApp';
import { space } from '@/theme/tokens';
import credits from '../../assets/credits.json';

const FAQ: [string, string][] = [
  ['למה כתוב "לא מאומת" על מוצר?', 'ערכי המאגר הבסיסי הם ערכי ייחוס כלליים. למוצר ממותג יש לסרוק ברקוד או להזין מהתווית.'],
  ['מה קורה כשחסר ערך תזונתי?', 'ערך חסר לא נספר כאפס. הסכום מסומן כחלקי (*).'],
  ['למה התזכורת לא צלצלה במצב שקט?', 'אפליקציות רגילות באייפון שולחות התראה מקומית ולא שעון מעורר מערכתי. במצב שקט/ריכוז ייתכן שלא יושמע צליל.'],
  ['האם הנתונים שלי מסונכרנים?', 'כרגע הנתונים נשמרים במכשיר. סנכרון יופעל לאחר חיבור השרת (Supabase).'],
  ['האם Premium פעיל?', 'עדיין לא. אין רכישה ואין חיוב. כל כלי הבסיס חינמיים.'],
  ['האפליקציה מחליפה איש מקצוע?', 'לא. במקרה של כאב, פציעה או שאלה רפואית – פנה לאיש מקצוע.'],
];

/** 55 Help, bug report, wrong product report, terms & privacy */
export default function Help() {
  const report = useApp((s) => s.reportFood);
  const [kind, setKind] = useState<'bug' | 'product' | 'idea'>('bug');
  const [text, setText] = useState('');
  return (
    <Screen title="עזרה ודיווח">
      <Section title="שאלות נפוצות" style={{ marginTop: 0 }}>
        {FAQ.map(([q, a]) => <Card key={q} style={{ marginBottom: 8, gap: 4 }}><T.H>{q}</T.H><T.Muted>{a}</T.Muted></Card>)}
      </Section>
      <Section title="דיווח">
        <Row style={{ marginBottom: space.sm }}>
          <Chip label="באג" active={kind === 'bug'} onPress={() => setKind('bug')} />
          <Chip label="מוצר שגוי" active={kind === 'product'} onPress={() => setKind('product')} />
          <Chip label="רעיון" active={kind === 'idea'} onPress={() => setKind('idea')} />
        </Row>
        <Field label="פירוט" value={text} onChangeText={setText} multiline placeholder="מה קרה? באיזה מסך?" />
        <Button title="שליחה" disabled={text.trim().length < 5} onPress={() => { report(undefined, `[${kind}] ${text.trim()}`); setText(''); toast('הדיווח נשמר. תודה!'); }} />
        <T.Caption style={{ marginTop: 6 }}>הדיווחים נשמרים במכשיר ויישלחו לשרת לאחר חיבורו.</T.Caption>
      </Section>
      <Section title="תנאי שימוש ופרטיות (תקציר)">
        <Card style={{ gap: 6 }}>
          <T.Muted>• המידע האישי שלך (יומן, מדידות, אימונים) שייך לך, וניתן לייצא או למחוק אותו בכל עת מההגדרות.</T.Muted>
          <T.Muted>• אנחנו לא מוכרים מידע. הרשאות (מצלמה, התראות) מתבקשות רק כשצריך.</T.Muted>
          <T.Muted>• התוכן אינו ייעוץ רפואי. ערכים תזונתיים עשויים להיות לא מדויקים.</T.Muted>
          <T.Muted>• נוסח משפטי מלא יפורסם לפני השקה.</T.Muted>
        </Card>
      </Section>
      <Section title="קרדיט תמונות">
        <Card style={{ gap: 6 }}>
          <T.Muted>איורי תרגילים: Everkinetic (CC BY-SA 3.0). תמונות מזון: Wikimedia Commons. כל התמונות ברישיון חופשי לשימוש מסחרי.</T.Muted>
          {(credits.credits as { file: string; title: string; author: string; license: string; source: string }[]).map((c) => (
            <T.Caption key={c.file}>{c.title.replace('File:', '')} · {c.author || 'לא צוין'} · {c.license}</T.Caption>
          ))}
        </Card>
      </Section>
      <T.Caption style={{ textAlign: 'center', marginTop: space.lg }}>MIZRAHI PINTO · גרסה 1.1.0</T.Caption>
    </Screen>
  );
}
