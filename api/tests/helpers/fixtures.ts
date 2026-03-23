export interface BlueprintPayload {
  name: string;
  version: string;
  author: string;
  blueprint_data: Record<string, unknown>;
}

// Base factory — override any field by passing a partial
export const buildBlueprint = (
  overrides: Partial<BlueprintPayload> = {}
): BlueprintPayload => ({
  name: "aws-neptune",
  version: "1.0.0",
  author: "platform-team",
  blueprint_data: {
    packages: ["aws-cdk-lib"],
    props: { instanceType: "db.r5.large" },
    outs: { clusterEndpoint: "endpoint" },
  },
  ...overrides,
});
