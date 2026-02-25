import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import CreateForm from './pages/CreateForm';
import EditForm from './pages/EditForm';
import PreviewForm from './pages/PreviewForm';
import ExamPage from './pages/ExamPage';
import ResponseSummary from './pages/ResponseSummary';
import ResponseDetail from './pages/ResponseDetail';
import SuccessPage from './pages/SuccessPage';
import NotFound from './pages/NotFound';

// Global styles - AirLume Redesign
import './styles/global.css';
import './styles/layout.css';
import './styles/navbar.css';
import './styles/buttons.css';
import './styles/cards.css';
import './styles/forms.css';
import './styles/hero.css';
import './styles/animations.css';

// Component-specific legacy styles
import './styles/Exam.css';
import './styles/Timer.css';
import './styles/Proctor.css';

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/create" element={<CreateForm />} />
                <Route path="/edit/:formId" element={<EditForm />} />
                <Route path="/preview/:formId" element={<PreviewForm />} />
                <Route path="/exam/:formId" element={<ExamPage />} />
                <Route path="/responses/:formId" element={<ResponseSummary />} />
                <Route path="/responses/:formId/:responseId" element={<ResponseDetail />} />
                <Route path="/success" element={<SuccessPage />} />
                <Route path="*" element={<NotFound />} />
            </Routes>
        </BrowserRouter>
    );
}
