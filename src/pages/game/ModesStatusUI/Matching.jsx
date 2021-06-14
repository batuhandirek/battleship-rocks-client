import { useAppCtx } from '../../../appContext';
import { Spinner } from '../../../components/Spinner';

export function Matching() {
    const { navigateTo, api, token } = useAppCtx();

    const handleFindCancel = async () => {
        await api.cancelFindGame({
            token,
        });
        navigateTo('home');
    };

    return (
        <box top="center" left="center">
            <box top={0} height="50%" left="center" width="100%">
                <text top="center" left="center">
                    Finding an opponent
                </text>
            </box>
            <box left="center" top="50%">
                <Spinner tick={150} dotCount={10} boxProps={{ height: 2, left: 'center' }} />
                <button
                    top={4}
                    left="center"
                    width={15}
                    height={1}
                    keys={true}
                    focused
                    onPress={handleFindCancel}
                    align="center"
                    style={{ bold: true, bg: 'green', fg: 'white' }}
                    content={`Cancel`}
                    bold
                />
            </box>
        </box>
    );
}
