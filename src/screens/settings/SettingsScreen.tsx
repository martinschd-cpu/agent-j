import { useState } from 'react';
import { Icon } from '../../components/Icon';
import { Row, Section, Segmented, Toggle, TopBar } from '../../components/ui';
import { CHANNELS, INVOICES, USER } from '../../data/profile';
import { type ThemePref, useStore } from '../../lib/store';
import { BUILD_TIME, COMMIT, VERSION } from '../../lib/version';
import { ModelList } from '../chat/parts';

export function SettingsScreen() {
  const store = useStore();
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div className="page">
      <TopBar title="Einstellungen" />
      <div className="page-body page-narrow">
        <Section title="Account">
          <div className="card">
            <div className="account">
              <span className="initials initials-lg">{USER.name[0]}</span>
              <div className="account-main">
                <div className="profile-name">{USER.name}</div>
                <div className="muted">{USER.email}</div>
              </div>
              <button className="btn btn-soft btn-sm">Bearbeiten</button>
            </div>
            <Row icon="lock" title="Anmeldung & Sicherheit" detail="Passkey aktiv · 2 Geräte" onClick={() => {}} trailing={<Icon name="next" size={18} />} />
            <Row icon="logout" title="Abmelden" onClick={() => {}} />
          </div>
        </Section>

        <Section title="Abo & Zahlung">
          <div className="plan-card">
            <div>
              <div className="plan-name">Agent-J Plus</div>
              <div className="plan-price">
                19 € <span>/ Monat</span>
              </div>
              <div className="plan-meta">Nächste Abbuchung am 1. Oktober 2026</div>
            </div>
            <button className="btn btn-on-accent btn-sm">Plan ändern</button>
          </div>
          <div className="card">
            <Row icon="card" title="Zahlungsmethode" detail="Visa •••• 4242 · läuft ab 08/28" onClick={() => {}} trailing={<Icon name="next" size={18} />} />
            {INVOICES.map((i) => (
              <Row
                key={i.id}
                icon="download"
                title={`Rechnung ${i.date}`}
                detail={i.amount}
                onClick={() => {}}
                trailing={<span className="row-link">PDF</span>}
              />
            ))}
          </div>
        </Section>

        <Section title="Modell">
          <div className="card card-pad">
            <p className="muted small">Welches KI-Modell Agent-J für Chats und Agents nutzt.</p>
            <ModelList value={store.modelId} onChange={store.setModel} />
          </div>
        </Section>

        <Section title="Verbundene Kanäle">
          <div className="card">
            {CHANNELS.map((c) => {
              const on = store.channels[c.id];
              return (
                <Row
                  key={c.id}
                  icon={c.id === 'gmail' ? 'mail' : c.id === 'kalender' ? 'calendar' : c.id === 'whatsapp' ? 'phone' : 'hash'}
                  title={c.name}
                  detail={on ? (c.connected ? c.detail : 'Verbunden') : 'Nicht verbunden'}
                  trailing={
                    <button className={`btn btn-sm ${on ? 'btn-ghost' : 'btn-primary'}`} onClick={() => store.toggleChannel(c.id)}>
                      {on ? 'Trennen' : 'Verbinden'}
                    </button>
                  }
                />
              );
            })}
          </div>
        </Section>

        <Section title="Darstellung">
          <div className="card card-pad">
            <Segmented<ThemePref>
              value={store.themePref}
              onChange={store.setThemePref}
              options={[
                { id: 'light', label: <><Icon name="sun" size={16} /> Hell</> },
                { id: 'dark', label: <><Icon name="moon" size={16} /> Dunkel</> },
                { id: 'system', label: <><Icon name="monitor" size={16} /> System</> },
              ]}
            />
          </div>
        </Section>

        <Section title="Benachrichtigungen">
          <div className="card">
            <Row icon="bell" title="Push-Benachrichtigungen" trailing={<Toggle checked={store.notifications.push} onChange={() => store.toggleNotification('push')} label="Push" />} />
            <Row icon="sun" title="Tägliche Zusammenfassung" detail="Morning Brief um 07:00" trailing={<Toggle checked={store.notifications.daily} onChange={() => store.toggleNotification('daily')} label="Zusammenfassung" />} />
            <Row icon="mail" title="E-Mail-Updates" trailing={<Toggle checked={store.notifications.email} onChange={() => store.toggleNotification('email')} label="E-Mail" />} />
          </div>
        </Section>

        <Section title="Datenschutz">
          <div className="card">
            <Row icon="shield" title="Was Agent-J speichern darf" detail="Chats, Aufgaben, Kontakte" onClick={() => {}} trailing={<Icon name="next" size={18} />} />
            <Row icon="download" title="Meine Daten exportieren" onClick={() => {}} trailing={<Icon name="next" size={18} />} />
            <Row icon="trash" title="Gedächtnis löschen" danger onClick={() => {}} />
          </div>
        </Section>

        <Section title="Über">
          <div className="card">
            <Row icon="info" title="Version" detail={`v${VERSION} · ${COMMIT} · ${BUILD_TIME}`} />
            <Row
              icon="refresh"
              title={confirmReset ? 'Wirklich zurücksetzen?' : 'Demo zurücksetzen'}
              detail="Setzt alle Klicks im Clickdummy auf die Beispieldaten zurück"
              danger={confirmReset}
              onClick={() => {
                if (confirmReset) {
                  store.reset();
                  setConfirmReset(false);
                } else setConfirmReset(true);
              }}
            />
          </div>
        </Section>
      </div>
    </div>
  );
}
