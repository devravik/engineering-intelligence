// False-Positive Trap Fixture: Intentional dependency inversion boundary interface
export interface UserRepository {
  findById(id: string): Promise<any>;
  save(user: any): Promise<void>;
}

export class PostgresUserRepository implements UserRepository {
  async findById(id: string) {
    return { id };
  }

  async save(user: any) {
    // save implementation
  }
}
