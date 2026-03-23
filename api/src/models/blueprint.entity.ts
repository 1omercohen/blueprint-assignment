import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";

@Entity("blueprints")
export class BlueprintEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 255, nullable: false })
  name!: string;

  @Column({ type: "varchar", length: 50, nullable: false })
  version!: string;

  @Column({ type: "varchar", length: 255, nullable: false })
  author!: string;

  @Column({ type: "jsonb", nullable: false })
  blueprint_data!: object;

  @CreateDateColumn({ type: "timestamp" })
  created_at!: Date;
}
