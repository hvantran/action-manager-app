
import React, { createContext } from 'react';

export interface ActionContextParams {
    setNumberOfFailureJobs: any

}
export const ActionContext = createContext<ActionContextParams>({ setNumberOfFailureJobs: undefined });

export const ActionProvider = (props: any) => {
    const { children, ...restProps } = props

    return (
        <ActionContext.Provider value={restProps}>
            {children}
        </ActionContext.Provider>
    )
}