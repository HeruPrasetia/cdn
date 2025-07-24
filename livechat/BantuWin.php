<?php
/*
Plugin Name: BantuWin LiveChat
Description: Tambahkan live chat ke website Anda.
Version: 1.0
Author: BantuWin
*/

add_action('admin_menu', 'bwlc_add_admin_menu');
add_action('admin_init', 'bwlc_settings_init');
add_action('wp_footer', 'bwlc_embed_script');

// Tambah menu settings
function bwlc_add_admin_menu()
{
    add_options_page(
        'BantuWin LiveChat Settings', // Title halaman
        'BantuWin LiveChat',          // Nama menu di sidebar Settings
        'manage_options',             // Capability
        'bwlc-settings',              // Slug
        'bwlc_settings_page'          // Callback untuk tampilkan form
    );
}

// Form settings
function bwlc_settings_page()
{
?>
    <div class="wrap">
        <h1>BantuWin LiveChat Settings</h1>
        <form method="post" action="options.php">
            <?php
            settings_fields('bwlc_settings_group');
            do_settings_sections('bwlc_settings_group');
            ?>
            <table class="form-table">
                <tr valign="top">
                    <th scope="row">Client Key</th>
                    <td>
                        <input type="text" name="bwlc_client_key" value="<?php echo esc_attr(get_option('bwlc_client_key')); ?>" />
                    </td>
                </tr>
                <tr valign="top">
                    <th scope="row">Device Key</th>
                    <td>
                        <input type="text" name="bwlc_device_key" value="<?php echo esc_attr(get_option('bwlc_device_key')); ?>" />
                    </td>
                </tr>
            </table>
            <?php submit_button(); ?>
        </form>
    </div>
<?php
}

// Daftarin setting
function bwlc_settings_init()
{
    register_setting('bwlc_settings_group', 'bwlc_client_key');
    register_setting('bwlc_settings_group', 'bwlc_device_key');
}

// Inject script di footer
function bwlc_embed_script()
{
    $client_key = esc_attr(get_option('bwlc_client_key'));
    $device_key = esc_attr(get_option('bwlc_device_key'));
    if ($client_key) {
        echo '<script src="https://cdn.jsdelivr.net/gh/HeruPrasetia/cdn@master/livechat/livechatv-2.js" domain-server="apps.bantuwin.id" client-key="' . $client_key . '" device-key="' . $device_key . '"></script>';
    }
}
?>