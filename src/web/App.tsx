import {useLazyLoadQuery, graphql} from 'react-relay';
import type { AppQuery } from './__generated__/AppQuery.graphql';

export function App() {
  const data = useLazyLoadQuery<AppQuery>(graphql`
    query AppQuery {
      me {
        name
      }
    }
  `, {});
  return <pre>{JSON.stringify(data.me?.name, null, 4)}</pre>
}