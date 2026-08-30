# Decision — Printmailing artifacts bridge Design and Outreach

**Date:** 2026-08-30  
**Status:** adopted

## Problem

A physical prospect mailing is itself designed output. Several versions may exist before one version is actually printed and mailed. SolidDesign must preserve that exact output so the dossier can later answer:

- which versions existed;
- which version was physically sent;
- when it was sent;
- which LIVE website concept belonged to that send.

The solution must not become a generic document-management or workflow system.

## First-principles separation

The print file and the physical send are different facts:

```text
DESIGN
creates immutable printmailing versions

OUTREACH
records that one exact version was physically sent
```

Therefore the artifact belongs to the Design output lifecycle, while the send belongs to Outreach activity. The same stored file is shown in both places; it is never duplicated between phases.

## Data model

Add only one new business table:

```text
mailing_artifacts
- id
- prospect_id
- storage_path
- file_name
- content_type
- size_bytes
- version_note
- created_by
- created_at
```

Existing `mailings` remains the physical-send record and gains:

```text
artifact_id -> mailing_artifacts.id
```

Every physical mailing must reference exactly one stored artifact version. The existing `demo_id` snapshots the LIVE website concept at send time.

Version numbers are derived from creation order. They are not separately stored.

## Storage

Use one private Supabase Storage bucket:

```text
mailing-artifacts
```

Accepted MVP formats:

- PDF — preferred final print artifact;
- PNG;
- JPG.

Maximum file size: 25 MB.

Uploaded artifacts are immutable after metadata registration. A new design creates a new version rather than overwriting an old file.

No public bucket, CDN publication, thumbnail service, source-design repository or generic attachment abstraction is introduced.

## CMS behavior

### Design

Show a **Printmailing** card after the website mock-up workflow:

- upload new version;
- optional short change note;
- derived v1/v2/v3 history;
- open stored version;
- indicate if a version has actually been sent.

### Outreach

Show a **Fysieke mailing** card using the same stored versions:

- select the exact version to send;
- open/check it;
- explicitly **Registreer als verstuurd**;
- retain send history.

The latest version is selected by default, but an older version can deliberately be sent.

Registering a send requires a current LIVE mock-up. The send atomically records the selected artifact and current LIVE demo. Early contact states may advance to `mailed`; later states are never regressed.

## Activity

Material dossier events:

```text
mailing_artifact_created
mailing_marked_sent
```

The actor is the authenticated team member. UI navigation/file previews are not events.

## Non-goals

Do not add:

- a generic attachments table;
- folders/tags;
- document approval workflow;
- editable/final status state machine;
- check-in/check-out;
- comments on files;
- automatic print ordering;
- external print-vendor integration;
- source-file version control;
- a second outreach datastore.

If real operational use later proves one of these necessary, add only that observed capability.

## Why this is the smallest correct solution

A single artifact table is necessary because multiple design versions can exist before any physical send. Reusing only `mailings` would incorrectly make every design iteration look like a send/prepared campaign state. A generic attachment subsystem would solve a much larger problem than exists.

The chosen model preserves the business evidence that matters while keeping Design, Outreach, Storage and event history explicit and simple.
