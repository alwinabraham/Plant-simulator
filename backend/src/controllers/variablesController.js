import { prisma } from "../lib/prisma.js";

function slugifyKey(input) {
  return String(input)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

export async function listVariables(_req, res, next) {
  try {
    const items = await prisma.variable.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    res.json(items);
  } catch (error) {
    next(error);
  }
}

export async function createVariable(req, res, next) {
  try {
    const { name, key, description, weight, sortOrder } = req.body ?? {};
    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "name is required" });
    }

    const resolvedKey = key?.trim() ? slugifyKey(key) : slugifyKey(name);
    if (!resolvedKey) {
      return res.status(400).json({ error: "Could not derive a valid key from name" });
    }

    const order =
      sortOrder !== undefined && sortOrder !== null && sortOrder !== ""
        ? Number(sortOrder)
        : undefined;
    const parsedWeight =
      weight !== undefined && weight !== null && weight !== "" ? Number(weight) : undefined;
    if (parsedWeight !== undefined && !Number.isFinite(parsedWeight)) {
      return res.status(400).json({ error: "weight must be a valid number" });
    }

    const created = await prisma.variable.create({
      data: {
        name: name.trim(),
        key: resolvedKey,
        description:
          description != null && String(description).trim() !== ""
            ? String(description).trim()
            : null,
        weight: parsedWeight !== undefined ? parsedWeight : 0.1,
        sortOrder: Number.isFinite(order) ? order : 0,
      },
    });
    res.status(201).json(created);
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({ error: "A variable with this key already exists" });
    }
    next(error);
  }
}
