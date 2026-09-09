import { Env } from './middleware/auth';
import { UserContext } from '../domain/policies';

export type AppContext = {
  Bindings: Env;
  Variables: {
    db: any;
    user: UserContext;
  };
};
