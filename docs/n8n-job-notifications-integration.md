# Integrazione n8n con Sistema di Notifiche Job

Questa guida spiega come integrare i workflow n8n con il sistema di notifiche job di Mindley.

## Architettura

Il sistema utilizza:

- **Tabelle Supabase**: `jobs` e `job_steps` per tracciare l'esecuzione
- **Edge Functions**: Per gestire la creazione e aggiornamento dei job
- **Realtime**: Per notifiche live al frontend
- **Toast Notifications**: Per feedback immediato all'utente

## Setup del Workflow n8n

### 1. Nodo di Inizializzazione (HTTP Request)

All'inizio del tuo workflow, aggiungi un nodo HTTP Request per creare il job:

```javascript
// Nodo: HTTP Request - Create Job
// Method: POST
// URL: https://your-supabase-project.supabase.co/functions/v1/create-job

// Headers:
{
  "Authorization": "Bearer {{ $json.user_token }}",
  "Content-Type": "application/json"
}

// Body:
{
  "workflow_name": "Process Resource",
  "resource_id": {{ $json.resource_id }},
  "metadata": {
    "triggered_by": "user",
    "source": "dashboard"
  },
  "steps": [
    {
      "step_name": "extract_content",
      "step_type": "content_extraction",
      "step_order": 1,
      "metadata": {
        "description": "Estrazione contenuto dalla risorsa"
      }
    },
    {
      "step_name": "generate_summary",
      "step_type": "ai_processing",
      "step_order": 2,
      "metadata": {
        "description": "Generazione riassunto con AI"
      }
    },
    {
      "step_name": "extract_tags",
      "step_type": "ai_processing",
      "step_order": 3,
      "metadata": {
        "description": "Estrazione tag automatici"
      }
    },
    {
      "step_name": "save_resource",
      "step_type": "database_operation",
      "step_order": 4,
      "metadata": {
        "description": "Salvataggio nel database"
      }
    }
  ]
}
```

### 2. Nodi di Aggiornamento Stato

Per ogni passo importante del workflow, aggiungi un nodo HTTP Request per aggiornare lo stato:

```javascript
// Nodo: HTTP Request - Update Step Status
// Method: POST
// URL: https://your-supabase-project.supabase.co/functions/v1/update-job-step

// Headers:
{
  "Authorization": "Bearer {{ $json.user_token }}",
  "Content-Type": "application/json"
}

// Body per iniziare un passo:
{
  "job_id": "{{ $('Create Job').item.json.id }}",
  "step_name": "extract_content",
  "status": "running",
  "workflow_execution_id": "{{ $workflow.id }}"
}

// Body per completare un passo:
{
  "job_id": "{{ $('Create Job').item.json.id }}",
  "step_name": "extract_content",
  "status": "completed",
  "output_data": {
    "content_length": {{ $json.content.length }},
    "extraction_time": "{{ $now }}"
  }
}

// Body per errore:
{
  "job_id": "{{ $('Create Job').item.json.id }}",
  "step_name": "extract_content",
  "status": "failed",
  "error_message": "{{ $json.error.message }}"
}
```

## Struttura Workflow Raccomandato

```
┌─────────────────┐
│   Trigger       │
│   (Webhook)     │
└─────────┬───────┘
          │
┌─────────▼───────┐
│   Create Job    │
│   (HTTP Request)│
└─────────┬───────┘
          │
┌─────────▼───────┐    ┌─────────────────┐
│ Update Step:    │    │   Extract       │
│ extract_content │───▶│   Content       │
│ → "running"     │    │   (Your Logic)  │
└─────────┬───────┘    └─────────┬───────┘
          │                      │
          └──────────────────────┘
          │
┌─────────▼───────┐
│ Update Step:    │
│ extract_content │
│ → "completed"   │
└─────────┬───────┘
          │
┌─────────▼───────┐    ┌─────────────────┐
│ Update Step:    │    │   Generate      │
│ generate_summary│───▶│   Summary       │
│ → "running"     │    │   (AI Call)     │
└─────────┬───────┘    └─────────┬───────┘
          │                      │
          └──────────────────────┘
          │
┌─────────▼───────┐
│ Update Step:    │
│ generate_summary│
│ → "completed"   │
└─────────┬───────┘
          │
          ⋮
```

## Code Node per JavaScript

Se preferisci usare un Code Node JavaScript, ecco una funzione helper:

```javascript
// Funzione helper per aggiornare lo stato del job
async function updateJobStep(jobId, stepName, status, options = {}) {
  const { errorMessage, outputData, workflowExecutionId, userToken } = options;

  const body = {
    job_id: jobId,
    step_name: stepName,
    status: status,
  };

  if (errorMessage) body.error_message = errorMessage;
  if (outputData) body.output_data = outputData;
  if (workflowExecutionId) body.workflow_execution_id = workflowExecutionId;

  const response = await fetch(
    "https://your-supabase-project.supabase.co/functions/v1/update-job-step",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${userToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to update job step: ${response.statusText}`);
  }

  return await response.json();
}

// Esempio di utilizzo nel Code Node:
const jobId = $("Create Job").item.json.id;
const userToken = $input.item.json.user_token;

try {
  // Inizia il passo
  await updateJobStep(jobId, "extract_content", "running", {
    userToken,
    workflowExecutionId: $workflow.id,
  });

  // La tua logica qui...
  const result = await extractContent($input.item.json.url);

  // Completa il passo
  await updateJobStep(jobId, "extract_content", "completed", {
    userToken,
    outputData: {
      content_length: result.content.length,
      url_processed: $input.item.json.url,
    },
  });

  return { success: true, content: result.content };
} catch (error) {
  // Segna come fallito
  await updateJobStep(jobId, "extract_content", "failed", {
    userToken,
    errorMessage: error.message,
  });

  throw error;
}
```

## Gestione Errori

### Error Workflow Branch

Aggiungi un ramo di gestione errori che aggiorna lo stato in caso di fallimento:

```javascript
// Nodo: Error Handler
// Tipo: HTTP Request

// Headers:
{
  "Authorization": "Bearer {{ $json.user_token }}",
  "Content-Type": "application/json"
}

// Body:
{
  "job_id": "{{ $('Create Job').item.json.id }}",
  "step_name": "{{ $json.current_step }}",
  "status": "failed",
  "error_message": "{{ $json.error.message || 'Errore sconosciuto' }}"
}
```

## Frontend Integration

Nel tuo frontend React, usa il componente `JobMonitor` per visualizzare i job in tempo reale:

```tsx
import { JobMonitor } from "@/components/job-monitor";

function Dashboard() {
  return (
    <div className="space-y-6">
      <h1>Dashboard</h1>

      {/* Monitor dei workflow */}
      <JobMonitor />

      {/* Altri componenti... */}
    </div>
  );
}
```

## Triggering da Frontend

Per avviare un workflow dal frontend:

```typescript
import { JobService } from "@/services/jobService";

const startWorkflow = async (resourceId: number) => {
  try {
    // Crea il job nel database
    const job = await JobService.createJob({
      workflow_name: "Process Resource",
      resource_id: resourceId,
      steps: [
        { name: "extract_content", type: "content_extraction" },
        { name: "generate_summary", type: "ai_processing" },
        { name: "extract_tags", type: "ai_processing" },
        { name: "save_resource", type: "database_operation" },
      ],
    });

    // Triggera il webhook n8n
    const response = await fetch("https://your-n8n-webhook-url", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        job_id: job.id,
        resource_id: resourceId,
        user_token: session.access_token,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to trigger workflow");
    }
  } catch (error) {
    console.error("Error starting workflow:", error);
  }
};
```

## Environment Variables

Assicurati di configurare queste variabili in n8n:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Best Practices

1. **Timeout Handling**: Aggiungi timeout ai nodi HTTP Request (es. 30 secondi)
2. **Retry Logic**: Configura retry per i nodi critici
3. **Error Handling**: Sempre aggiorna lo stato in caso di errore
4. **Logging**: Usa nodi di logging per debug
5. **Batch Processing**: Per grandi volumi, considera il batch processing
6. **Rate Limiting**: Rispetta i rate limit delle API

## Monitoraggio

Il sistema fornisce automaticamente:

- Notifiche toast in tempo reale
- Progress bar per job attivi
- Storico dei job completati
- Dettagli degli errori
- Durata di esecuzione

Tutte le notifiche sono visibili nell'interfaccia utente senza necessità di polling.
