import { BaseEntity } from '@/shared/domain/entities/base-entity.entity';
import { Email } from '../value-objects/email.vo';
import { Username } from '../value-objects/username.vo';
import { EPlan } from '@/shared/plans/plan.enum';
import { Name } from '@/shared/domain/value-objects/name.vo';

type UserProps = {
    name: Name;
    username: Username;
    email: Email;
    password: string;
    plan: EPlan;
    /** Ids dos tutoriais (um por tela) que o usuário já viu. */
    seenTutorials?: string[];
};

export class User extends BaseEntity<UserProps> {
    constructor(
        id: string,
        props: UserProps,
        createdAt: Date,
        updatedAt: Date,
    ) {
        super(id, { ...props, name: props.name }, createdAt, updatedAt);
    }

    public get name(): Name {
        return this.props.name;
    }

    public get username(): Username {
        return this.props.username;
    }

    public get email(): Email {
        return this.props.email;
    }

    public get password(): string {
        return this.props.password;
    }

    public get plan(): EPlan {
        return this.props.plan;
    }

    public get seenTutorials(): string[] {
        return [...(this.props.seenTutorials ?? [])];
    }

    public markTutorialSeen(id: string): void {
        if (this.seenTutorials.includes(id)) return;

        this.props.seenTutorials = [...this.seenTutorials, id];
        this.touch();
    }

    public resetTutorials(): void {
        if (this.seenTutorials.length === 0) return;

        this.props.seenTutorials = [];
        this.touch();
    }

    public changePlan(plan: EPlan): void {
        if (this.props.plan === plan) return;

        this.props.plan = plan;
        this.touch();
    }

    public rename(name: Name): void {
        if (this.name.equals(name)) return;

        this.props.name = name;
        this.touch();
    }

    public changeEmail(email: Email): void {
        if (!email.equals(this.props.email)) {
            this.props.email = email;
            this.touch();
        }
    }

    public changePassword(password: string): void {
        if (this.password !== password) {
            this.props.password = password;
            this.touch();
        }
    }
}
