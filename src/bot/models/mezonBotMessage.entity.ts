import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { TABLE } from '../constants/table';

@Entity(TABLE.MEZON_BOT_MESSAGE)
export class MezonBotMessage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text', nullable: true })
  messageId: string;

  @Column({ type: 'text', nullable: true })
  userId: string;

  @Column({ type: 'text', nullable: true, default: null })
  content: string;

  @Column({ type: 'decimal', default: null })
  createAt: number;
}
