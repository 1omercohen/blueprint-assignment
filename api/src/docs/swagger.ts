const SWAGGER_TITLE = "Blueprint Manager API";
const SWAGGER_VERSION = "1.0.0";
const SWAGGER_DESCRIPTION = "REST API for storing and managing Bluebricks Blueprints";

const blueprintDataExample = {
  description: "AWS Neptune Blueprint for Bluebricks",
  manifest_version: 1,
  packages: [{ name: "aws-neptune", version: "1.0.0", source: "bluebricks/catalog" }],
  props: {
    engineVersion: "1.2.0.2",
    instanceType: "db.r5.large",
    region: "us-east-1",
    multiAZ: false,
  },
  outs: {
    endpoint: "",
    port: "",
    arn: "",
  },
};

const blueprintSchema = {
  type: "object",
  properties: {
    id: { type: "integer", example: 1 },
    name: { type: "string", example: "aws_neptune" },
    version: { type: "string", example: "1.1.0" },
    author: { type: "string", example: "bluebricks@example.com" },
    blueprint_data: { type: "object", example: blueprintDataExample },
    created_at: { type: "string", format: "date-time" },
  },
};

const createBlueprintBody = {
  type: "object",
  required: ["name", "version", "author", "blueprint_data"],
  properties: {
    name: { type: "string", example: "aws_neptune" },
    version: { type: "string", example: "1.1.0" },
    author: { type: "string", example: "bluebricks@example.com" },
    blueprint_data: { type: "object", example: blueprintDataExample },
  },
};

const paginationParams = [
  { name: "page", in: "query", schema: { type: "integer", default: 1 }, description: "Page number" },
  { name: "page_size", in: "query", schema: { type: "integer", default: 20, maximum: 100 }, description: "Items per page" },
  { name: "sort_by", in: "query", schema: { type: "string", enum: ["name", "version", "created_at"] }, description: "Sort field" },
  { name: "sort_order", in: "query", schema: { type: "string", enum: ["ASC", "DESC"], default: "DESC" }, description: "Sort direction" },
];

const idParam = {
  name: "id",
  in: "path",
  required: true,
  schema: { type: "integer" },
  description: "Blueprint ID",
};

const errorResponse = (description: string) => ({
  description,
  content: {
    "application/json": {
      schema: {
        type: "object",
        properties: { error: { type: "string" } },
      },
    },
  },
});

export const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: SWAGGER_TITLE,
    version: SWAGGER_VERSION,
    description: SWAGGER_DESCRIPTION,
  },
  paths: {
    "/blueprints": {
      post: {
        summary: "Create a blueprint",
        tags: ["Blueprints"],
        requestBody: {
          required: true,
          content: { "application/json": { schema: createBlueprintBody } },
        },
        responses: {
          201: { description: "Blueprint created", content: { "application/json": { schema: blueprintSchema } } },
          400: errorResponse("Validation failed"),
        },
      },
      get: {
        summary: "List blueprints with pagination and sorting",
        tags: ["Blueprints"],
        parameters: paginationParams,
        responses: {
          200: {
            description: "Paginated list of blueprints",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { type: "array", items: blueprintSchema },
                    pagination: {
                      type: "object",
                      properties: {
                        page: { type: "integer" },
                        page_size: { type: "integer" },
                        total_items: { type: "integer" },
                        total_pages: { type: "integer" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/blueprints/{id}": {
      get: {
        summary: "Get a blueprint by ID",
        tags: ["Blueprints"],
        parameters: [idParam],
        responses: {
          200: { description: "Blueprint found", content: { "application/json": { schema: blueprintSchema } } },
          404: errorResponse("Blueprint not found"),
        },
      },
      put: {
        summary: "Update a blueprint by ID",
        tags: ["Blueprints"],
        parameters: [idParam],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { ...createBlueprintBody, required: [] } } },
        },
        responses: {
          200: { description: "Blueprint updated", content: { "application/json": { schema: blueprintSchema } } },
          400: errorResponse("Validation failed"),
          404: errorResponse("Blueprint not found"),
        },
      },
      delete: {
        summary: "Delete a blueprint by ID",
        tags: ["Blueprints"],
        parameters: [idParam],
        responses: {
          204: { description: "Blueprint deleted" },
          404: errorResponse("Blueprint not found"),
        },
      },
    },
  },
};
