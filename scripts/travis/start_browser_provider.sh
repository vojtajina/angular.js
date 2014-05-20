if [ $BROWSER_PROVIDER = "bs" ]; then
  ./lib/browser-stack/start-tunnel.sh
elif [ $BROWSER_PROVIDER = "sl" ]; then
  ./lib/sauce/sauce_connect_setup.sh
else
  echo "Unknown browser provider. Please set BROWSER_PROVIDER=bs or BROWSER_PROVIDER=sl."
fi
