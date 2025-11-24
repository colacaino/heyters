const db = require("../db");

function mapEventRequest(row) {
  if (!row) return null;
  return {
    id: row.id,
    requesterId: row.requester_id,
    title: row.title,
    opponentName: row.opponent_name,
    description: row.description,
    eventDate: row.event_date,
    entryFeeCents: row.entry_fee_cents,
    commissionPercent: row.commission_percent,
    location: row.location,
    eventFormat: row.event_format,
    capacity: row.capacity,
    coverUrl: row.cover_url,
    streamUrl: row.stream_url,
    requirements: row.requirements,
    status: row.status,
    adminNotes: row.admin_notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function createEventRequest({
  requesterId,
  title,
  opponentName,
  description,
  eventDate,
  entryFeeCents = 0,
  commissionPercent = 20,
  location,
  eventFormat = "online",
  capacity = null,
  coverUrl = null,
  streamUrl = null,
  requirements = null,
}) {
  const { rows } = await db.query(
    `
      INSERT INTO event_requests (
        requester_id,
        title,
        opponent_name,
        description,
        event_date,
        entry_fee_cents,
        commission_percent,
        location,
        event_format,
        capacity,
        cover_url,
        stream_url,
        requirements
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *;
    `,
    [
      requesterId,
      title,
      opponentName,
      description,
      eventDate,
      entryFeeCents,
      commissionPercent,
      location,
      eventFormat,
      capacity,
      coverUrl,
      streamUrl,
      requirements,
    ]
  );

  return mapEventRequest(rows[0]);
}

async function listEventRequests({ status = null, requesterId = null } = {}) {
  const conditions = [];
  const values = [];
  let index = 1;

  if (status) {
    conditions.push(`status = $${index++}`);
    values.push(status);
  }

  if (requesterId) {
    conditions.push(`requester_id = $${index++}`);
    values.push(requesterId);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const { rows } = await db.query(
    `
      SELECT *
      FROM event_requests
      ${whereClause}
      ORDER BY created_at DESC;
    `,
    values
  );

  return rows.map(mapEventRequest);
}

async function listApprovedEvents() {
  const { rows } = await db.query(
    `
      SELECT er.*, u.display_name AS requester_name
      FROM event_requests er
      JOIN users u ON er.requester_id = u.id
      WHERE er.status = 'approved'
        AND er.event_date >= NOW() - INTERVAL '1 day'
      ORDER BY er.event_date ASC;
    `
  );

  return rows.map((row) => ({
    ...mapEventRequest(row),
    requesterName: row.requester_name,
  }));
}

async function getEventRequestById(id) {
  const { rows } = await db.query(
    `
      SELECT *
      FROM event_requests
      WHERE id = $1
      LIMIT 1;
    `,
    [id]
  );
  return mapEventRequest(rows[0]);
}

async function updateEventRequest(id, data = {}) {
  const allowedFields = {
    title: "title",
    opponentName: "opponent_name",
    description: "description",
    eventDate: "event_date",
    entryFeeCents: "entry_fee_cents",
    commissionPercent: "commission_percent",
    location: "location",
    eventFormat: "event_format",
    capacity: "capacity",
    coverUrl: "cover_url",
    streamUrl: "stream_url",
    requirements: "requirements",
    status: "status",
    adminNotes: "admin_notes",
  };

  const setClauses = [];
  const values = [];
  let index = 1;

  for (const [key, column] of Object.entries(allowedFields)) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      setClauses.push(`${column} = $${index}`);
      values.push(data[key]);
      index += 1;
    }
  }

  if (setClauses.length === 0) {
    return getEventRequestById(id);
  }

  values.push(id);

  const { rows } = await db.query(
    `
      UPDATE event_requests
      SET ${setClauses.join(", ")}
      WHERE id = $${index}
      RETURNING *;
    `,
    values
  );

  return mapEventRequest(rows[0]);
}

async function createEventTicket({ eventId, userId, pricePaidCents }) {
  const { rows } = await db.query(
    `
      INSERT INTO event_tickets (
        event_id,
        user_id,
        price_paid_cents
      )
      VALUES ($1, $2, $3)
      ON CONFLICT (event_id, user_id)
      DO NOTHING
      RETURNING *;
    `,
    [eventId, userId, pricePaidCents]
  );

  return rows[0] || null;
}

async function hasTicket(eventId, userId) {
  const { rowCount } = await db.query(
    `
      SELECT 1
      FROM event_tickets
      WHERE event_id = $1
        AND user_id = $2
      LIMIT 1;
    `,
    [eventId, userId]
  );
  return rowCount > 0;
}

async function listTicketsByUser(userId) {
  const { rows } = await db.query(
    `
      SELECT et.*, er.title, er.event_date
      FROM event_tickets et
      JOIN event_requests er ON et.event_id = er.id
      WHERE et.user_id = $1
      ORDER BY er.event_date ASC;
    `,
    [userId]
  );

  return rows.map((row) => ({
    id: row.id,
    eventId: row.event_id,
    userId: row.user_id,
    pricePaidCents: row.price_paid_cents,
    createdAt: row.created_at,
    title: row.title,
    eventDate: row.event_date,
  }));
}

module.exports = {
  createEventRequest,
  listEventRequests,
  listApprovedEvents,
  getEventRequestById,
  updateEventRequest,
  createEventTicket,
  hasTicket,
  listTicketsByUser,
};
