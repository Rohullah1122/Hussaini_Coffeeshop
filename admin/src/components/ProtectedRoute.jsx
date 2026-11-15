import {Navigate} from "react-router-dom";


// only a logged-in admin can see the pages inside
const ProtectedRoute = ({admin,children}) => {

    if (!admin) return <Navigate to="/login" replace />;

    return children;
};

export default ProtectedRoute;
