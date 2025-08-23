
// src/agent/composio-mcp-server.ts
import { createServer } from 'http';
import { URL } from 'url';
import axios from 'axios';
import { config } from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Setup paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '..', '.env');
console.log(`🔍 Looking for .env file at: ${envPath}`);
config({ path: envPath });

// Env
const PORT = process.env.COMPOSIO_PORT ? parseInt(process.env.COMPOSIO_PORT) : 3003;
const COMPOSIO_API_KEY = process.env.COMPOSIO_API_KEY;
const COMPOSIO_ORG_API_KEY = process.env.COMPOSIO_ORG_API_KEY || process.env.COMPOSIO_API_KEY; // fallback
const COMPOSIO_WORKSPACE_ID = process.env.COMPOSIO_WORKSPACE_ID;
const DEFAULT_AUTH_CONFIG_ID = process.env.DEFAULT_AUTH_CONFIG_ID || ''; // optional default

const COMPOSIO_BASE = 'https://backend.composio.dev';

console.log('🔧 Environment Variables Status:');
console.log(`   PORT: ${PORT}`);
console.log(`   COMPOSIO_API_KEY: ${COMPOSIO_API_KEY ? '✅ Set' : '❌ Not Set'}`);
console.log(`   COMPOSIO_ORG_API_KEY: ${COMPOSIO_ORG_API_KEY ? '✅ Set' : '❌ Not Set'}`);
console.log(`   COMPOSIO_WORKSPACE_ID: ${COMPOSIO_WORKSPACE_ID ? '✅ Set' : '❌ Not Set'}`);
if (!COMPOSIO_API_KEY) {
  console.warn('⚠️  COMPOSIO_API_KEY not set. Put it in .env as COMPOSIO_API_KEY');
}
if (!COMPOSIO_WORKSPACE_ID) {
  console.warn('⚠️  COMPOSIO_WORKSPACE_ID not set. Put it in .env as COMPOSIO_WORKSPACE_ID');
}


// Composio MCP Server Tools
const tools = [
  {
    name: 'composio_send_email',
    description: 'Send emails using various email providers (Gmail, Outlook, SendGrid, etc.) with support for attachments, HTML content, and scheduling.',
    inputSchema: {
      type: 'object',
      properties: {
        to: {
          type: 'string',
          description: 'Recipient email address or comma-separated list of addresses'
        },
        subject: {
          type: 'string',
          description: 'Email subject line'
        },
        body: {
          type: 'string',
          description: 'Email body content (supports HTML)'
        },
        from: {
          type: 'string',
          description: 'Sender email address (optional, uses default if not specified)'
        },
        cc: {
          type: 'string',
          description: 'CC recipients (comma-separated)'
        },
        bcc: {
          type: 'string',
          description: 'BCC recipients (comma-separated)'
        },
        attachments: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of file URLs or base64 encoded files to attach'
        },
        scheduleFor: {
          type: 'string',
          description: 'ISO timestamp to schedule email for future delivery'
        }
      },
      required: ['to', 'subject', 'body']
    }
  },
  {
    name: 'composio_whatsapp_message',
    description: 'Send WhatsApp messages using various WhatsApp Business API providers with support for text, media, and templates.',
    inputSchema: {
      type: 'object',
      properties: {
        phoneNumber: {
          type: 'string',
          description: 'Recipient phone number in international format (e.g., +1234567890)'
        },
        message: {
          type: 'string',
          description: 'Message content'
        },
        messageType: {
          type: 'string',
          enum: ['text', 'image', 'document', 'audio', 'video', 'template'],
          description: 'Type of message to send',
          default: 'text'
        },
        mediaUrl: {
          type: 'string',
          description: 'URL of media file (required for image/document/audio/video types)'
        },
        templateName: {
          type: 'string',
          description: 'Template name to use (required for template type)'
        },
        templateVariables: {
          type: 'object',
          description: 'Variables to substitute in the template'
        }
      },
      required: ['phoneNumber', 'message']
    }
  },
  {
    name: 'composio_slack_message',
    description: 'Send messages to Slack channels, direct messages, or threads with support for rich formatting and attachments.',
    inputSchema: {
      type: 'object',
      properties: {
        channel: {
          type: 'string',
          description: 'Slack channel name or ID (e.g., #general or C1234567890)'
        },
        message: {
          type: 'string',
          description: 'Message content (supports Slack markdown)'
        },
        threadTs: {
          type: 'string',
          description: 'Thread timestamp to reply to existing thread'
        },
        attachments: {
          type: 'array',
          items: { type: 'object' },
          description: 'Slack attachment objects for rich formatting'
        },
        blocks: {
          type: 'array',
          items: { type: 'object' },
          description: 'Slack block kit blocks for advanced layouts'
        }
      },
      required: ['channel', 'message']
    }
  },
  {
    name: 'composio_calendar_event',
    description: 'Create, update, and manage calendar events across various providers (Google Calendar, Outlook, etc.) with scheduling and reminders.',
    inputSchema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Event title or summary'
        },
        startTime: {
          type: 'string',
          description: 'Event start time (ISO timestamp)'
        },
        endTime: {
          type: 'string',
          description: 'Event end time (ISO timestamp)'
        },
        description: {
          type: 'string',
          description: 'Event description'
        },
        location: {
          type: 'string',
          description: 'Event location'
        },
        attendees: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of attendee email addresses'
        },
        reminders: {
          type: 'array',
          items: { type: 'object' },
          description: 'Array of reminder objects with timing and method'
        }
      },
      required: ['title', 'startTime', 'endTime']
    }
  },
  {
    name: 'composio_crm_contact',
    description: 'Create, update, and manage contacts in various CRM systems (Salesforce, HubSpot, Pipedrive, etc.) with contact details and custom fields.',
    inputSchema: {
      type: 'object',
      properties: {
        firstName: {
          type: 'string',
          description: 'Contact first name'
        },
        lastName: {
          type: 'string',
          description: 'Contact last name'
        },
        email: {
          type: 'string',
          description: 'Contact email address'
        },
        phone: {
          type: 'string',
          description: 'Contact phone number'
        },
        company: {
          type: 'string',
          description: 'Company name'
        },
        jobTitle: {
          type: 'string',
          description: 'Job title or position'
        },
        customFields: {
          type: 'object',
          description: 'Additional custom fields specific to the CRM'
        }
      },
      required: ['firstName', 'lastName', 'email']
    }
  },
  {
    name: 'composio_file_upload',
    description: 'Upload files to various cloud storage providers (Google Drive, Dropbox, OneDrive, AWS S3) with support for different file types and sharing options.',
    inputSchema: {
      type: 'object',
      properties: {
        fileUrl: {
          type: 'string',
          description: 'URL of the file to upload or base64 encoded file data'
        },
        fileName: {
          type: 'string',
          description: 'Name for the uploaded file'
        },
        destination: {
          type: 'string',
          description: 'Destination folder or path in the cloud storage'
        },
        sharing: {
          type: 'object',
          description: 'Sharing settings (public, private, specific users)'
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags to apply to the uploaded file'
        }
      },
      required: ['fileUrl', 'fileName']
    }
  },
  {
    name: 'composio_database_query',
    description: 'Execute database queries on various database systems (PostgreSQL, MySQL, MongoDB, etc.) with support for read and write operations.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'SQL query or database operation to execute'
        },
        databaseType: {
          type: 'string',
          enum: ['postgresql', 'mysql', 'mongodb', 'sqlite', 'mariadb'],
          description: 'Type of database to connect to'
        },
        connectionString: {
          type: 'string',
          description: 'Database connection string or credentials'
        },
        parameters: {
          type: 'array',
          description: 'Query parameters for prepared statements'
        }
      },
      required: ['query', 'databaseType']
    }
  },
  {
    name: 'composio_webhook_trigger',
    description: 'Trigger webhooks to integrate with external systems, APIs, and automation platforms with customizable payloads and headers.',
    inputSchema: {
      type: 'object',
      properties: {
        webhookUrl: {
          type: 'string',
          description: 'URL of the webhook endpoint to trigger'
        },
        payload: {
          type: 'object',
          description: 'Data payload to send with the webhook'
        },
        method: {
          type: 'string',
          enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
          description: 'HTTP method to use',
          default: 'POST'
        },
        headers: {
          type: 'object',
          description: 'Custom HTTP headers to include'
        },
        timeout: {
          type: 'number',
          description: 'Request timeout in milliseconds',
          default: 30000
        }
      },
      required: ['webhookUrl']
    }
  }
];



// helper: build composio headers
function composioHeaders() {
  return {
    'Content-Type': 'application/json',
    'x-api-key': COMPOSIO_API_KEY || '',
    'x-org-api-key': COMPOSIO_ORG_API_KEY || '',
    'X-Workspace-ID': COMPOSIO_WORKSPACE_ID || ''
  };
}

async function tryComposioEndpoints(emailPayload: any) {
  const tries = [
    { path: '/api/v1/apps/openapi/send_email_to_client', type: 'direct' },
    { path: '/api/v1/actions/execute', type: 'execute', actionNames: ['GMAIL_SEND_EMAIL', 'gmail_send_email', 'send_email'] },
    { path: 'api/v1/tools/GMAIL_SEND_EMAIL/execute', type: 'direct' },
    { path: '/api/v1/toolkits/gmail/send_email', type: 'direct' },
  ];

  let lastErr: any = null;

  for (const t of tries) {
    const url = `${COMPOSIO_BASE}${t.path}`;
    try {
      console.log(`📡 Trying Composio endpoint: ${url} (type=${t.type})`);
      let resp;
      if (t.type === 'direct') {
        resp = await axios.post(url, emailPayload, { headers: composioHeaders(), timeout: 30000 });
      } else if (t.type === 'execute') {
        for (const actionName of t.actionNames || ['send_email']) {
          const execBody = { action: actionName, input: emailPayload };
          try {
            resp = await axios.post(url, execBody, { headers: composioHeaders(), timeout: 30000 });
            break; // stop on first successful execute
          } catch (e) {
            lastErr = e;
            continue; // try next actionName
          }
        }
        if (!resp) continue; // no successful execute -> try next endpoint
      }

      // Ensure resp is defined
      if (resp) return resp;
    } catch (error: any) {
      lastErr = error;
      continue; // try next endpoint
    }
  }

  // If no endpoint succeeded
  const e = new Error('All Composio endpoints failed');
  (e as any).cause = lastErr;
  throw e;
}

// Minimal JSON parser helper (defensive)
function safeParseJson(s: string) {
  try {
    return JSON.parse(s || '{}');
  } catch {
    return {};
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host}`);
  const path = url.pathname;
  const method = req.method;

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,x-api-key,x-org-api-key,X-Workspace-ID');

  if (method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  console.log(`${method} ${path}`);

  try {
    if (path === '/info' && method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        name: 'Composio MCP Server',
        version: '1.0.0',
        description: 'MCP server providing access to Composio platform tools for email, messaging, CRM, calendar, and more integrations',
        requires: COMPOSIO_API_KEY ? 'API Key Configured' : 'COMPOSIO_API_KEY environment variable needed'
      }));
      return;
    }

    if (path === '/tools' && method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(tools));
      return;
    }

    if (path === '/test-api' && method === 'GET') {
      if (!COMPOSIO_API_KEY) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'API key not configured' }));
        return;
      }
      try {
        console.log('🧪 Testing Composio API connection...');
        const testResponse = await axios.get(`${COMPOSIO_BASE}/api/v1/apps/openapi`, {
          headers: composioHeaders(),
          timeout: 10000
        });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: 'API connection successful',
          status: testResponse.status,
          data: testResponse.data
        }));
      } catch (error: any) {
        console.error('🧪 API test failed:', error.response?.status || error.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'API test failed',
          details: error.message,
          status: error.response?.status,
          data: error.response?.data
        }));
      }
      return;
    }

    // Email handler
    if (path === '/tools/composio_send_email/execute' && method === 'POST') {
      if (!COMPOSIO_API_KEY) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Composio API key not configured',
          message: 'Please set COMPOSIO_API_KEY environment variable'
        }));
        return;
      }

      let raw = '';
      req.on('data', chunk => { raw += chunk.toString(); });
      req.on('end', async () => {
        try {
          console.log('Raw incoming body:', raw.slice(0, 2000));
          const parsed = safeParseJson(raw);

          // Accept different shapes
          const args = parsed.arguments ?? parsed.args ?? parsed;
          if (!args || typeof args !== 'object') {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid request: expected an object with to, subject, body' }));
            return;
          }

          const to = args.to;
          const subject = args.subject;
          const emailBody = args.body || args.html || args.content;
          const from = args.from;
          const cc = args.cc;
          const bcc = args.bcc;
          const attachments = args.attachments;
          const scheduleFor = args.scheduleFor;
          const auth_config_id = args.auth_config_id || DEFAULT_AUTH_CONFIG_ID || undefined;

          if (!to || !subject || !emailBody) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'to, subject, and body are required' }));
            return;
          }

          // Build payload to forward to Composio — include auth_config_id if available
          const forwardPayload: any = {
            to, subject, body: emailBody
          };
          if (from) forwardPayload.from = from;
          if (cc) forwardPayload.cc = cc;
          if (bcc) forwardPayload.bcc = bcc;
          if (attachments) forwardPayload.attachments = attachments;
          if (scheduleFor) forwardPayload.scheduleFor = scheduleFor;
          if (auth_config_id) forwardPayload.auth_config_id = auth_config_id;

          console.log(`📧 Sending email via Composio: to=${to}, subject=${subject}, auth_config_id=${auth_config_id || 'none'}`);

          // Try multiple endpoints
          const resp = await tryComposioEndpoints(forwardPayload);

          // Normalize response
          const okResult = {
            success: true,
            status: resp.status,
            data: resp.data
          };
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(okResult));
        } catch (error: any) {
          console.error('Error sending email:', error);
          if (error.response) {
            console.error('📡 API Response Status:', error.response.status);
            console.error('📡 API Response Data:', JSON.stringify(error.response.data).slice(0, 2000));
            console.error('📡 API Response Headers:', error.response.headers);
          } else {
            console.error('📡 Error setting up request:', error.message || error);
          }
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            error: 'Failed to send email',
            details: error.message,
            status: error.response?.status,
            apiResponse: error.response?.data
          }));
        }
      });
      return;
    }

    // You can keep other handlers (whatsapp, slack, calendar) here — unchanged or similar pattern
    // For brevity, they'll reply with 404 not implemented in this snippet.
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Endpoint not found' }));

  } catch (error) {
    console.error('Server error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
});

server.listen(PORT, () => {
  console.log(`🎯 Composio MCP Server running on port ${PORT}`);
  console.log(`📡 Available endpoints:`);
  console.log(`   GET  /info`);
  console.log(`   GET  /tools`);
  console.log(`   GET  /test-api`);
  console.log(`   POST /tools/composio_send_email/execute`);
  if (!COMPOSIO_API_KEY) {
    console.log(`⚠️  Warning: COMPOSIO_API_KEY not set. Get your API key at https://composio.dev`);
  }
});

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down Composio MCP Server...');
  server.close(() => {
    console.log('✅ Server stopped');
    process.exit(0);
  });
});
