<?php
/*
Plugin Name: BantuWin LiveChat
Plugin URI: https://bantuwin.id
Description: Tambahkan live chat ke website Anda.
Version: 1.0
Author: BantuWin
Author URI: https://apps.bantuwin.id
*/

// Hook untuk nambah menu settings di admin
add_action('admin_menu', 'ylc_add_admin_menu');
// Hook untuk nyematin script ke front-end
add_action('wp_footer', 'ylc_embed_script');

function ylc_add_admin_menu() {
    add_options_page('BantuWin LiveChat', 'BantuWin LiveChat', 'manage_options', 'BantuWin LiveChat', 'ylc_options_page');
}

function ylc_options_page() {
    ?>
    <div class="wrap">
        <h1>Your Live Chat Settings</h1>
        <form method="post" action="options.php">
            <?php
                settings_fields('ylc_settings_group');
                do_settings_sections('ylc_settings_group');
            ?>
            <table class="form-table">
                <tr valign="top">
                <th scope="row">Client Key</th>
                <td><input type="text" name="ylc_client_key" value="<?php echo esc_attr(get_option('ylc_client_key')); ?>" /></td>
                </tr>
            </table>
            <?php submit_button(); ?>
        </form>
    </div>
    <?php
}

// Register setting
add_action('admin_init', 'ylc_settings_init');
function ylc_settings_init() {
    register_setting('ylc_settings_group', 'ylc_client_key');
}

function ylc_embed_script() {
    $client_key = esc_attr(get_option('ylc_client_key'));
    if ($client_key) {
        echo '<script src="https://cdn.jsdelivr.net/gh/HeruPrasetia/cdn/livechat/livechat.js" client-key="' . $client_key . '"></script>';
    }
}
?>
