import { AppProvider } from '@/store/AppContext';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import DashboardLayout from '@/components/layout/DashboardLayout';
import HubPage from '@/pages/HubPage';
import MissionBoardPage from '@/pages/MissionBoardPage';
import EpisodesPage from '@/pages/EpisodesPage';
import ContextFilesPage from '@/pages/ContextFilesPage';
import SettingsPage from '@/pages/SettingsPage';

function Router() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/" component={HubPage} />
        <Route path="/missions" component={MissionBoardPage} />
        <Route path="/episodes" component={EpisodesPage} />
        <Route path="/files" component={ContextFilesPage} />
        <Route path="/settings" component={SettingsPage} />
        <Route path="/:rest*" component={() => <div className="p-8 text-center text-muted-foreground">Page not found</div>} />
      </Switch>
    </DashboardLayout>
  );
}

function App() {
  return (
    <AppProvider>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </AppProvider>
  );
}

export default App;
