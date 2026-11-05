# Product


## Platform

android

(Built with Expo / React Native, so it also runs on iOS and on the web via react-native-web for demos. Android is the primary target: most students and families in the audience use Android phones. One brand design language across platforms.)

## Stack

Expo (React Native) + TypeScript, chosen by the user. Data for the MVP: seeded demo data stored in a MySQL database behind a small Node.js/Express API (`servidor/`). No integration with official SENAI systems (TCC scope limitation, section 3.8).

## Users

- **Aluno** (student, often a minor): checks general announcements, individual notices, own profile (course, class, schedule), and contacts support.
- **Responsável** (parent/guardian, up to 2 per student): follows the student's school life, sends medical certificates, answers authorization requests (e.g. early release from the SENAI unit), contacts support.
- **Professor, Coordenador, Diretor, Secretaria** (staff): publish announcements, send individual notices (e.g. suspension), review certificates and authorizations, answer support tickets addressed to them.

Each student links at most 3 access profiles: the student plus 2 guardians.

## Product Purpose

Meu SENAI centralizes school-family communication for a SENAI unit in one mobile app, replacing scattered channels (paper notes, messaging groups, calls). Success: a guardian learns about a notice, sends a certificate, or authorizes an early release in under a minute, and staff see and act on it in one place. Academic TCC project (Trabalho de Conclusão de Curso).

## Positioning

Built around SENAI's technical-course reality (turmas, cursos, entry/exit times per weekday) and around the guardian's legal role: authorizations and certificates are tied to a specific student and only reach authorized profiles.

## Operating Context

Used on phones, often quickly between other tasks: a guardian at work, a student between classes, a secretary at the front desk. Communication is the core; the app does not replace SENAI's academic/administrative systems.

## Capabilities and Constraints

Functional requirements from the TCC document (RF01–RF12): authentication, role-based access, student profile (name, birth date, class, course, weekdays and entry/exit times, linked guardians), guardian linking (max 2), general announcements, individual notices, notifications, document upload (medical certificates), guardian authorizations including early release, support center with recipient selection (coordenador, diretor, secretaria, professor), and support ticket tracking.

Business rules RN01–RN10: auth before restricted features; each profile sees only what its role allows; individual notices only reach their recipients; documents and authorizations are bound to a student and visible only to authorized users; support requests go to the selected sector.

Non-functional: security and LGPD-aware privacy, simple usability, consistency, maintainable code.

## Brand Commitments

- Name: **Meu SENAI**.
- Palette pinned by the user: blue as primary, white as secondary, red and black for detail accents.
- Structural references named by the user: Layers Super App and MeuSesi (school super-app layout: profile header, feed of communications, shortcut grid, bottom tab navigation).

## Evidence on Hand

TCC documentation (Downloads/Documentação Tcc Meu Senai.docx). No real student data, logos, or photos: all demo people, classes and messages are synthetic and must be labeled as demo data. No official SENAI logo asset provided; do not fabricate one.

## Product Principles

1. The right message reaches only the right people.
2. Every action a guardian takes is one screen, one tap to confirm.
3. Status is always visible: sent, seen, pending, approved, rejected.
4. Staff and families use the same app; the role decides what appears.

## Accessibility & Inclusion

Audience spans teenagers to older guardians with varied digital literacy: large touch targets, legible text sizes, plain Portuguese copy, no information conveyed by color alone.
