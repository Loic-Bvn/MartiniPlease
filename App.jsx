import { AppProvider } from './context/AppContext';
import CocktailMenuApp from './CocktailMenuApp';

function App() {
    return (
        <AppProvider>
        <CocktailMenuApp />
        </AppProvider>
    );
}

export default App;