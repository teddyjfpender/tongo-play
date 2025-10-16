import {ActivityIndicator, Button, ButtonProps, View} from "react-native";

export type ProgressButtonProps = ButtonProps & {
    isLoading: boolean;
};

export const ProgressButton = ({isLoading, ...buttonProps}: ProgressButtonProps) => {
    const {disabled} = buttonProps;
    return (
        <View style={{
            justifyContent: "center",
            alignSelf: "center",
            flexDirection: "row"
        }}
        >
            <View>
                <Button
                    {...buttonProps}
                    disabled={disabled || isLoading}
                />
            </View>


            {isLoading && (
                <ActivityIndicator
                    style={{}}
                    size={24}
                    color={"black"}
                />
            )}
        </View>
    );
}