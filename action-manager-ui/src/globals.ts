export { };

declare global {

    interface Window {
        _env_: {
            REACT_APP_ACTION_MANAGER_BACKEND_URL: string
            REACT_APP_TEMPLATE_MANAGER_BACKEND_URL: string
            REACT_APP_ECOMMERCE_MANAGER_BACKEND_URL: string
            REACT_APP_ENDPOINT_MANAGER_BACKEND_URL: string

            REACT_APP_TEMPLATE_MANAGER_FRONTEND_URL: string
            REACT_APP_ACTION_MANAGER_FRONTEND_URL: string
            REACT_APP_ECOMMERCE_MANAGER_FRONTEND_URL: string
            REACT_APP_ENDPOINT_MANAGER_FRONTEND_URL: string

            REACT_APP_TEMPLATE_MANAGER_NAME: string
            REACT_APP_ACTION_MANAGER_NAME: string
            REACT_APP_ECOMMERCE_MANAGER_NAME: string
            REACT_APP_ENDPOINT_MANAGER_NAME: string


            REACT_APP_PAGES: string
            REACT_APP_NAME: string
            REACT_APP_ICON: string
        };
    }
}