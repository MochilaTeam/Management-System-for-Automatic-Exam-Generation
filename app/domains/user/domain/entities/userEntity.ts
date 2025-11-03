type UserProps = {
    id: string;
    email: string; //TODO: QUITAR SI DESPUES SE DEFINE QUE USER NO TIENE EMAIL
    username: string;
    passwordHash: string;
};

export class UserEntity {
    private constructor(private readonly props: UserProps) {}

    get id() {
        return this.props.id;
    }
    get username() {
        return this.props.username;
    }
    get email() {
        return this.props.email;
    }
    get passwordHash() {
        return this.props.passwordHash;
    }
}


